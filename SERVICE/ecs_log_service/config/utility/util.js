function isRequired(arg){
    throw new Error(`${arg} is required.`);
}

module.exports = {
    isRequired
};