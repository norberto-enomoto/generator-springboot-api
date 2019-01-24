'use strict';

const { closeSync, openSync } = require('fs');
const touch = filename => closeSync(openSync(filename, 'w'));
const Generator = require('yeoman-generator');
const Prompt = require('prompt-checkbox');

module.exports = class extends Generator {
	constructor(args, opts) {
		super(args, opts);
		this.log('Initializing...');
	}
	
	start() {
		
		this.prompt([
			{
				type    : 'input',
				name    : 'group', 
				default : 'org.javaleo.api', 
				message : 'Please type the groupId [org.javaleo.api]: ', 
				validate: function(group) {
					var validPack = typeof group == 'string' && group.indexOf('.') > 0;
					if (!validPack) {
						console.log('\n groupId must be a string and contains at least one point "."');
					}
					return validPack;
				}
			}, 
			{
				type    : 'input',
				name    : 'artifact', 
				default : 'springest', 
				message : 'Enter a name for the artifactId [springest]: '
			}, 
			{
				type 	: 'input', 
				name 	: 'appname', 
				default : 'Api Base Application', 
				message : 'Type the application Title [Api Base Application]: ' 
			}, 
			{
				type	: 'rawlist', 
				name	: 'container', 
				default : 'undertow', 
				message : 'Select a micro-server [1 = undertow]: ', 
				choices : ['undertow', 'jetty', 'tomcat']
			}, 
			{
				type	: 'checkbox', 
				name	: 'options',  
				message : 'Select the aditional options as below: ', 
				radio 	: true, 
				choices : [
					{name: 'Git Repo', value: 'git'}, 
					{name: 'Devtools', value: 'devtools'}, 
					{name: 'Swagger Docs', value: 'swagger'}, 
					{name: 'RabbitMQ', value: 'rabbitmq'}, 
					{name: 'Postgres', value: 'postgres'}, 
					{name: 'Redis Cache', value: 'redis'}, 
					{name: 'MongoDB', value: 'mongodb'}
				]
			}
		]).then((answers) => {
			var redis = answers.options.includes('redis');
			var swagger = answers.options.includes('swagger');
			var devtools = answers.options.includes('devtools');
			var packageRoot = answers.group;
			var artifactName = answers.artifact;
			var packageConfig = packageRoot + '.config';
			var packagePath = answers.group.split('.').join('/');
			var appName = answers.appname.replace(/\w\S*/g, function(txt){ return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); }).split(' ').join('') + 'Application';
			
			// root files
			this.destinationRoot(answers.artifact);
			closeSync(openSync('README.md', 'w'));
			closeSync(openSync('.gitignore', 'w'));
			this.fs.copyTpl(
				this.templatePath('pom.xml'),
				this.destinationPath('pom.xml'), 
				{
					artifact	: artifactName, 
					group		: packageRoot, 
					container	: answers.container, 
					appname		: appname, 
					swagger 	: swagger, 
					devtools 	: devtools, 
					redis 		: redis
				}
			);
			
			// resources
			this.destinationRoot('src/main/resources');
			this.fs.copyTpl(
				this.templatePath('application.yml'),
				this.destinationPath('application.yml'), 
				{
					appname		: appName, 
					artifact 	: artifact, 
					packageRoot	: packageRoot
				}
			);
			this.fs.copyTpl(
				this.templatePath('bootstrap.yml'),
				this.destinationPath('bootstrap.yml'), 
				{
					artifact 	: artifact
				}
			);
			
			// i18n
			this.destinationRoot('./i18n');
			
			// java
			this.destinationRoot('../../java');
			this.destinationRoot(packagePath);
			this.fs.copyTpl(
				this.templatePath('ApiApplication.java'),
				this.destinationPath(appName + '.java'), 
				{
					appname		: appName, 
					group		: packageRoot
				}
			);
			
			// java::config
			this.destinationRoot('./config');
			if (redis) {
				this.fs.copyTpl(
					this.templatePath('CacheConfig.java'), 
					this.destinationPath('CacheConfig.java'), 
					{
						packageConfig: packageConfig
					}
				);
				this.fs.copyTpl(
					this.templatePath('CacheKeyGenerator.java'), 
					this.destinationPath('CacheKeyGenerator.java'), 
					{
						packageConfig: packageConfig
					}
				);
			}
			if (swagger) {
				this.fs.copyTpl(
					this.templatePath('SwaggerConfig.java'), 
					this.destinationPath('SwaggerConfig.java'), 
					{
						packageConfig: packageConfig
					}
				);
			}
		});
	}
};
