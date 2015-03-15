module.exports = function (grunt) {

	grunt.initConfig({

		bower: grunt.file.readJSON('.bowerrc'),
		bower_concat: {
			all: {
				dest: 'js/bower.js',
				dependencies: {
					'bootstrap-sass': 'jquery',
					'jquery.svg': ['jquery'],
					'jquery-mousewheel': ['jquery'],
					'jquery.finger': ['jquery'],
					'underscore': ['jquery']
				}
			}
		},
		copy:{
			dist:{
				files:[{
					expand:true,
					cwd: 'bower_components/font-awesome',
					src:['fonts/*'],
					dest:''
				},{
					expand:true,
					cwd: 'bower_components/font-awesome/scss',
					src:'*',
					dest:'sass/font-awesome'
				},{
					expand:true,
					cwd: 'bower_components/bootstrap-sass/assets/stylesheets',
					src:['bootstrap/*','_bootstrap.scss'],
					dest:'sass'
				}]
			}
		},
		uglify: {
			bower: {
				options: {
					sourceMap: true,
					sourceMapName: 'js/bower.min.js.map'
				},
				files: {
					'js/bower.min.js': ['js/bower.js']
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-bower-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('default', ['bower_concat','uglify']);

};