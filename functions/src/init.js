"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const admin = require('firebase-admin');
admin.initializeApp();
admin.firestore().settings({ timestampsInSnapshots: true });
exports.db = admin.firestore();