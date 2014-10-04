"use strict";

var _ = require('lodash');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var file = module.exports.File = {
  lines: {
    start: Number,
    end: Number
  },
  path: {
    project: String,
    full: String
  }
};

var tag = {
  tagDef: {
    name: String,
    required: Boolean,
    docProperty: String,
  },
  tagName: String,
  description: String,
  line: Number
};

var doc = {
  file: file,
  tags: [ tag ],
  name: String,
  description: String,
  deprecated: Boolean,
  area: String,
  api: String,
  priority: Number,
  codeName: String,
  id: String,
  methods: [ doc ],
  properties: [ doc ]
};

var Doc = mongoose.model('Doc', new Schema(doc));

function getDocs(doc) {
  var newDoc = {
    file: {
      // ast: doc.fileInfo.ast,
      path : {
        full: doc.fileInfo.filePath,
        project: doc.fileInfo.projectRelativePath
      },
      lines: {
        start: doc.startingLine,
        end: doc.endingLine
      }
    },
    tags: doc.tags && doc.tags.tags,
    name: doc.name
  };

  _.each(['name', 'description', 'area', 'api', 'priority', 'codeName', 'id', 'aliases', 'path'],
         function(prop) {
           if(doc[prop]) {
             newDoc[prop] = doc[prop];
           }
         });

  if(doc.methods) {
    console.log(doc.methods);
    newDoc.methods = _.map(doc.methods, getDocs);
  }
  if(doc.properties && doc.properties.length) {
    newDoc.properties = _.map(doc.properties, getDocs);
  }

  return newDoc;
}

mongoose.connect('mongodb://localhost/test-dev');

module.exports = function jsonTransform() {
  return {
    $runAfter: ['providerDocsProcessor'],
    $process: function(docs) {

      Doc.remove({}, function(err) {
        var docObjects = _.map(docs, getDocs);

        var deferred = q.defer();

        Doc.create(docObjects, function(err) {
          if(err) { deferred.reject(err); }
          else { deferred.resolve(docs); }
        });

        return deferred.promise;
      });
    }
  };
};
