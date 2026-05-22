const mongoose = require('mongoose');
const Transaction = require('../src/models/Transaction');

const pathInfo = Transaction.schema.path('normalized');
console.log('normalized path type:', pathInfo && pathInfo.instance);
console.log('normalized schema keys:', Object.keys(Transaction.schema.paths).filter(k=>k.startsWith('normalized')));
