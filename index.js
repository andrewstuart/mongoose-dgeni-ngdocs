"use strict";

var _ = require('lodash');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var fileDef = exports.fileDef = {
  lines: {
    start: Number,
    end: Number
  },
  path: {
    project: String,
    full: String
  }
};

var tagDef = exports.tagDef = {
  tagDef: {
    name: String,
    required: Boolean,
    docProperty: String,
  },
  tagName: String,
  description: String,
  line: Number
};

var docDef = exports.docDef = {
  file: fileDef,
  tags: [ tagDef ],
  name: String,
  description: String,
  deprecated: Boolean,
  area: String,
  api: String,
  priority: Number,
  codeName: String,
  id: String,
  methods: [ docDef ],
  properties: [ docDef ],
  params: [ docDef ]
};

var DocSchema = exports.DocSchema = new Schema(docDef);

exports.Doc = mongoose.model('Doc', DocSchema);

var getDocs = exports.getDocs = function mongooseDocs(doc) {
  var newDoc = {
    file: {
      // ast: doc.fileInfo.ast,
      path : {
        full: doc.fileInfo && doc.fileInfo.filePath,
        project: doc.fileInfo && doc.fileInfo.projectRelativePath
      },
      lines: {
        start: doc.startingLine,
        end: doc.endingLine
      }
    },
    tags: doc.tags && doc.tags.tags,
    name: doc.name
  };

  //TODO Combine these two iterators and a conditional. Maybe go recursive for coolness factor. I mean efficiency.
  _.each(['name', 'description', 'area', 'api', 'priority', 'codeName', 'id', 'aliases', 'path'],
         function(prop) {
           if(doc[prop]) {
             newDoc[prop] = doc[prop];
           }
         });

  _.each(['methods', 'properties', 'params'], function(prop) {
    if(doc[prop]) {
      newDoc[prop] = _.map(doc[prop], getDocs);
    }
  });

  return newDoc;
};
