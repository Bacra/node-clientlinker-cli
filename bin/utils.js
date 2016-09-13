"use strict";

var debug	= require('debug')('clientlinker:bin_utils');
var util	= require('util');
var vm		= require('vm');
var path	= require('path');
var chalk	= require('chalk');


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
}


exports.parseParam = parseParam;
function parseParam(linker, str)
{
	str = str && str.trim();
	if (!str) return;

	debug('run str start:%s', str);

	var data;
	try {
		data = vm.runInNewContext('('+str+')', {});
	}
	catch(err)
	{
		debug('run str err:%o', err);

		var parseDataSuc = false;
		// 判断参数是不是文件
		if (!/['"\{\}\n\r\t]/.test(str))
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

	// data = linker.JSON.parse(data);

	return data;
}


exports.printObject = printObject;
function printObject(obj)
{
	if (obj instanceof Error)
		return obj.stack;
	else if (typeof obj != 'object')
		return chalk.green(obj);
	else
		return util.inspect(obj, {depth: 8, colors: true});
}


exports.run = run;
function run(linker, action, query, body, options)
{
	console.log('\n ========= Action Run %s =========\n'
		+' >>> Query <<<\n%s\n\n'
		+' >>> Body <<<\n%s\n\n'
		+' >>> Options <<<\n%s',
		printObject(action),
		printObject(query),
		printObject(body),
		printObject(options));

	return linker.runIn([action, query, body, null, options], 'cli')
		.then(function(data)
		{
			console.log('\n ========= Action Result Success %s =========\n%s',
				printObject(action),
				printObject(data));
		},
		function(err)
		{
			console.log('\n ========= Action Result Error %s =========\n%s',
				printObject(action),
				printObject(err));
		});
}
