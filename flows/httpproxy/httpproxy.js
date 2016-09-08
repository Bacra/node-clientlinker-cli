"use strict";

var _		= require('underscore');
var debug	= require('debug')('client_linker:httpproxy');
var request	= require('request');
var aes		= require('../../lib/aes_cipher');

exports = module.exports = httpproxy;

function httpproxy(runtime, callback)
{
	var linker = runtime.client.linker;
	var body = getRequestBody(runtime);
	if (!body) return callback.next();
	var params = getRequestParams(runtime, body);

	request.post(params, function(err, respone, body)
	{
		var data;
		if (!err)
		{
			try {
				data = linker.JSON.parseFromString(body);
			}
			catch(e)
			{
				err = e;
			}

			if (data && data.env)
			{
				_.extend(runtime.env, data.env, {source: runtime.env.source});
			}

			if (respone.statusCode != 200)
			{
				err = new Error('httpproxy,respone!200,'+respone.statusCode);
			}
		}

		if (err)
		{
			debug('request err:%o', err);
			// 把错误暴露给外层，可以通过`runtime.retry[0].runnedFlows[0].httpproxyResponeError`获取
			callback.httpproxyResponeError = err;
			return callback.next();
		}

		if (data.result)
			callback(data.result);
		else
			callback(null, data.data);
	});
}


exports.appendUrl_ = appendUrl;
function appendUrl(url, query)
{
	var lastChar = url.charAt(url.length-1);
	var splitChar = lastChar == '?' || lastChar == '&'
			? '' : (url.indexOf('?') != -1 ? '&' : '?');

	return url + splitChar + query;
}


exports.getRequestBody_ = getRequestBody;
function getRequestBody(runtime)
{
	var client = runtime.client;
	var options = client.options;
	var linker = client.linker;

	if (!options.httpproxy) return false;

	if (linker.__bind_httpproxy_route__
		&& options.httpproxyNotRunWhenBindRoute !== false)
	{
		debug('[%s] not request httpproxy when bind route', runtime.action);
		return false;
	}

	var httpproxyMaxLevel = options.httpproxyMaxLevel;
	var httpproxyNextLevel = runtime.env.httpproxyLevel || 0;
	httpproxyNextLevel++;
	if ((!httpproxyMaxLevel && httpproxyMaxLevel !== 0)
		|| httpproxyMaxLevel < 0)
	{
		httpproxyMaxLevel = 1;
	}

	if (httpproxyNextLevel > httpproxyMaxLevel)
	{
		debug('[%s] not request httpproxy, level overflow:%d >= %d',
			runtime.action, httpproxyNextLevel, httpproxyMaxLevel);
		return false;
	}

	runtime.env.httpproxyLevel = httpproxyNextLevel;


	var body = {
		query		: runtime.query,
		body		: runtime.body,
		options	    : runtime.options,
		env			: runtime.env
	};

	// check aes key
	if (options.httpproxyKey)
		body.key = aes.cipher(runtime.action+','+Date.now(), options.httpproxyKey);

	return body;
}

exports.getRequestParams_ = getRequestParams;
function getRequestParams(runtime, body)
{
	var client = runtime.client;
	var options = client.options;
	var linker = client.linker;

	var headers = options.httpproxyHeaders || {};
	headers['Content-Type'] = 'application/jsonk';

	var runOptions	= runtime.options || {};
	var timeout		= runOptions.timeout || options.httpproxyTimeout || 10000;
	var proxy		= runOptions.httpproxyProxy
			|| options.httpproxyProxy
			|| process.env.clientlinker_http_proxy
			|| process.env.http_proxy;

	var url = appendUrl(options.httpproxy, 'action='+runtime.action);
	var bodystr = linker.JSON.stringifyToString(body);
	debug('request url:%s', url);


	return {
		url		: url,
		body	: bodystr,
		headers	: headers,
		timeout	: timeout,
		proxy	: proxy
	};
}
