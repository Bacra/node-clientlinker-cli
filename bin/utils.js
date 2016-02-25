var debug	= require('debug')('client_linker:bin_utils');
var util	= require('util');
var vm		= require('vm');
var json	= require('../lib/json');
var path	= require('path');


exports.parseAction = parseAction;
function parseAction(str, allMethods)
{
	str = str && str.trim();
	if (!str)
		return;
	else if (allMethods.indexOf(str) != -1)
		return str;
	else if (!isNaN(str))
		return allMethods[Number(str)-1];
	else
	{
		console.log('inval action :  %s', action);
		throw new Error('inval action');
	}
}


exports.parseParam = parseParam;
function parseParam(str)
{
	str = str && str.trim();
	if (!str) return;

	var data;
	try {
		data = vm.runInThisContext(str);
	}
	catch(err)
	{
		debug('run str err:%o', err);

		var parseDataSuc = false;
		if (str[0] == '{' && str[str.length-1] == '}')
		{
			try
			{
				data = vm.runInThisContext('('+str+')');
				parseDataSuc = true;
			}
			catch(err2)
			{
				debug('run (str) err:%o', err2);
			}
		}

		// 判断参数是不是文件
		if (!parseDataSuc && !/['"\{\}\n\r\t]/.test(str))
		{
			if (/^(((~|\.|\.\.)[\/\\])|\/)/.test(str))
			{
				var file;
				if (str[0] == '~')
				{
					if (process.env.HOME)
						file = path.resolve(process.env.HOME, str.substr(2));
				}
				else
					file = str;

				if (file)
				{
					file = path.resolve(file);
					debug('require pkg:%s', file);
					data = require(file);
					parseDataSuc = true;
				}
			}
			else if (process.platform === 'win32' && /^\w:[\/\\]/.test(str))
			{
				data = require(file);
				parseDataSuc = true;
			}
		}

		if (!parseDataSuc) throw err;
	}

	if (data && data.CONST_VARS) data = json.parse(data, data.CONST_VARS);

	return data;
}


exports.printObject = printObject;
function printObject(obj)
{
	if (obj instanceof Error)
		return obj.stack;
	else
		return util.inspect(obj, {depth: 8, colors: true});
}

exports.sortHandler = sortHandler;
function sortHandler(a,b){return a>b}