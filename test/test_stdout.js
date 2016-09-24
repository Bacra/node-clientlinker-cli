"use strict";

var Promise			= require('bluebird');
var fs				= require('fs');
var path			= require('path');
var mkdirp			= require('mkdirp');
var expect			= require('expect.js');
var stdout			= require('../bin/lib/stdout');
var TMP_LOG_FILE	= __dirname+'/tmp/stdout_log_file_'+process.pid;
mkdirp.sync(path.dirname(TMP_LOG_FILE));
var ws				= fs.createWriteStream(TMP_LOG_FILE, {flag:'a'});

describe('#stdout', function()
{
	beforeEach(function()
	{
		stdout.stdout = ws;
		stdout.stderr = ws;
	});

	afterEach(function()
	{
		stdout.stdout = process.stdout;
		stdout.stderr = process.stderr;
	});

	after(function()
	{
		stdout.stdout = process.stdout;
		stdout.stderr = process.stderr;
	});

	it('#console', function()
	{
		console.log(1);
		console.log();
		console.log('ab, %s', 'cd');
		console.warn('ab, %s', 'cd');
		console.info('ab, %s', 'cd');
		console.verbose('ab, %s', 'cd');
		console.error('ab, %s', 'cd');
	});

	it('#stdout', function()
	{
		stdout.log(1);
		stdout.log();
		stdout.log('ab, %s', 'cd');
		stdout.warn('ab, %s', 'cd');
		stdout.info('ab, %s', 'cd');
		stdout.verbose('ab, %s', 'cd');
		stdout.error('ab, %s', 'cd');
	});

	it('#write', function()
	{
		stdout.write('');
		stdout.write('abc');
		stdout.write('abc', 'error');
		stdout.write('abc', 'log');
	});

	it('#drain', function()
	{
		var content = new Array(1000).join('xxxxxx\n');
		while(stdout.write(content));
		return stdout.promise;
	});
});
