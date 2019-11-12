module.exports = function (grunt) {

	grunt.initConfig({

		bower: grunt.file.readJSON('.bowerrc'),
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
		cssmin: {
			target: {
				files: [{
					expand: true,
					cwd: 'css',
					src: ['*.css', '!*.min.css'],
					dest: 'css',
					ext: '.min.css'
				}]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	grunt.registerTask('install', ['copy']);
	grunt.registerTask('default', ['cssmin']);

};