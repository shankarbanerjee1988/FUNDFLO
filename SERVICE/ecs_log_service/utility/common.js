const removeEmptyAndNullFields = (product) => {
	let cleanProduct = {};
	for (let key in product) {
		if (product[key] !== null && product[key] !== '') {
			cleanProduct[key] = product[key];
		}
	}
	return cleanProduct;
}

const getChangedValues = (previousValues, newValues) => {
	let changedValues = {};
	for (let key in previousValues) {
		if (previousValues.hasOwnProperty(key)) {
			if (previousValues[key] && newValues[key] && previousValues[key] != newValues[key]) {
				changedValues[key] = newValues[key];
			}
		}
	}
	return changedValues;
}

module.exports = {
	removeEmptyAndNullFields,
	getChangedValues
}