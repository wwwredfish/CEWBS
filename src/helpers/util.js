var util = {};

util.toHex = function(n) {
	n = parseInt(n,10);
	if (isNaN(n)) {return "00"};
	
	n = Math.max(0,Math.min(n,255));
	return "0123456789ABCDEF".charAt((n-n%16)/16)
	+ "0123456789ABCDEF".charAt(n%16);
}

util.rgb2hex = function(rgb) {
	return util.toHex(rgb[0])+util.toHex(rgb[1])+util.toHex(rgb[2]);
}

util.hex2rgb = function(hexStr) {
	R = parseInt((hexStr).substring(0,2),16);
	G = parseInt((hexStr).substring(2,4),16);
	B = parseInt((hexStr).substring(4,6),16);
	return [R,G,B];
}

module.exports = util;
