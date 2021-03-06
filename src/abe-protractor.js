var glob = require('glob'),
    path = require('path'),
    util = require('util'),
    fs = require('fs'),
    errors = {
        'NO_FOLDER': 'not a folder',
        'NO_JSON': 'no JSON files in folder'
    },
    setupStub = function (match, options) {
        // Return early if this isn't a folder

        if (match.slice(1 * -1) !== path.sep) {
            return errors['NO_FOLDER'];
        }

        var jsonFiles = glob.sync(match + '*.json');

        // Return early if there are no JSON files in this folder

        if (jsonFiles.length === 0) {
            return errors['NO_JSON'];
        }

        var folder = path.basename(match),
            moduleName = util.format('app.stubs.%s', folder),
            stubPath = util
                .format(options.stubsLocation + '%s.stub.js', folder),
            stubFullPath = process.cwd() + stubPath,
            stub,
            data = {},
            methods = [];

        if (fs.existsSync(stubFullPath)) {
            stub = require(stubFullPath);
        } else {
            var generateStub = require('./abe-generate-stub.js');
            data = {
                'stub-options': {
                    'module_name': moduleName
                }
            };
            stub = generateStub.generateDefaultStub;
        }

        // Require each of the JSON files in the folder into a object hash
        // keyed by filename sans file extention, yielding an object with
        // a structure similar to,
        //
        // {
        //     query: {mock-data},
        //     get: {mock-data},
        //     post: {mock-data},
        //     put: {mock-data}
        // }

        jsonFiles.forEach(function (jsonPath) {
            var name = path.basename(jsonPath, '.json'),
                relPath = path.relative(__dirname, jsonPath);
            data[name] = require(relPath);
            methods.push(name);
        });

        if (options.log) {
            console.log(
                util.format('Adding %s module (%s)', moduleName, methods)
            );
        }

        // Tell Protractor to add the stubbed resource module to the app at
        // runtime. The mock data object is passed through to the stub.

        browser.addMockModule(moduleName, stub, data);
    };

exports.setupServiceStubs = function (options) {

    // Loop over all JSON mock data folders pased to the setupServiceStubs
    glob
        .sync(options.mocksLocation, {
            mark: true
        })
        .forEach(function (match) {
            setupStub(match, options);
        });
};
