#!/bin/sh
BASEDIR=$(dirname $0)
cd $BASEDIR

cp impress.js-repo/js/impress.js .

QWERTY_HANCOCK_INCLUDE_DIR='qhinclude'
mkdir -p $QWERTY_HANCOCK_INCLUDE_DIR
rm -r $QWERTY_HANCOCK_INCLUDE_DIR/*
cp -r qwerty-hancock-repo/demo $QWERTY_HANCOCK_INCLUDE_DIR/
cp -r qwerty-hancock-repo/src $QWERTY_HANCOCK_INCLUDE_DIR/
