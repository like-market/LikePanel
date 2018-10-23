// String => Id
exports.types = {
	'post': 1
}

exports.isCorrectTaskType = function(type) {
	return exports.types.hasOwnProperty(type);
}

exports.getTypeId = function(type) {
	return exports.types.type;
}