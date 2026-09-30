const electron = require('./electron')
module.exports = { ...electron.remote, getGlobal: () => ({}) }
