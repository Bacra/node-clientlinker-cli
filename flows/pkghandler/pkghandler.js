var debug = require('debug')('client_linker:pkghandler');
var runHandler = require('../confighandler/confighandler').runHandler;

exports = module.exports = pkghandler;
exports.initConfig = require('./initConfig');
exports.methods = require('./methods');

function pkghandler(runtime, callback)
{
	var client = runtime.client;
	initClient(client);

	if (!client.pkghandlerModule) return callback.next();
	var handler = client.pkghandlerModule[runtime.methodName];
	if (!handler)
	{
		debug('no handler:%s', runtime.methodName);
		return callback.next();
	}
	else
	{
		runHandler(runtime, callback, handler);
	}
}


exports.initClient = initClient;
function initClient(client)
{
	var options = client.options;
	if (!options.pkghandler) return;

	if (!client.pkghandlerModule)
	{
		try {
			client.pkghandlerModule = require(options.pkghandler);
		}
		catch(e)
		{
			debug('load pkg err:%o', e);
		}
	}
}
