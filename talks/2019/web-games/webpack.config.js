'use strict'
/* global module require __dirname */
const path = require('path')
module.exports = {
	mode: 'production',
	entry: './story-slides.source.js',
	output: {
		path: path.resolve(__dirname),
		filename: 'story-slides.min.js'
	},
	module: {
		rules: [
			{
				test: /story-slides.source.js/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				}
			}
		]
	}
}
