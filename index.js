"use strict";
require('reflect-metadata');
var utils_1 = require('./libs/utils');
/**
 * Decorator variable name
 *
 * @const
 */
var JSON_META_DATA_KEY = 'JsonProperty';
/**
 * DecoratorMetaData
 * Model used for decoration parameters
 *
 * @class
 * @property {string} name, indicate which json property needed to map
 * @property {string} clazz, if the target is not primitive type, map it to corresponding class
 */
var DecoratorMetaData = (function () {
    function DecoratorMetaData(name, clazz) {
        this.name = name;
        this.clazz = clazz;
    }
    return DecoratorMetaData;
}());
/**
 * JsonProperty
 *
 * @function
 * @property {IDecoratorMetaData<T>|string} metadata, encapsulate it to DecoratorMetaData for standard use
 * @return {(target:Object, targetKey:string | symbol)=> void} decorator function
 */
function JsonProperty(metadata) {
    var decoratorMetaData;
    if (utils_1.isTargetType(metadata, 'string')) {
        decoratorMetaData = new DecoratorMetaData(metadata);
    }
    else if (utils_1.isTargetType(metadata, 'object')) {
        decoratorMetaData = metadata;
    }
    else {
        throw new Error('index.ts: meta data in Json property is undefined. meta data: ' + metadata);
    }
    return Reflect.metadata(JSON_META_DATA_KEY, decoratorMetaData);
}
exports.JsonProperty = JsonProperty;
/**
 * getClazz
 *
 * @function
 * @property {any} target object
 * @property {string} propertyKey, used as target property
 * @return {Function} Function/Class indicate the target property type
 * @description Used for type checking, if it is not primitive type, loop inside recursively
 */
function getClazz(target, propertyKey) {
    return Reflect.getMetadata('design:type', target, propertyKey);
}
/**
 * getJsonProperty
 *
 * @function
 * @property {any} target object
 * @property {string} propertyKey, used as target property
 * @return {IDecoratorMetaData<T>} Obtain target property decorator meta data
 */
function getJsonProperty(target, propertyKey) {
    return Reflect.getMetadata(JSON_META_DATA_KEY, target, propertyKey);
}
/**
 * hasAnyNullOrUndefined
 *
 * @function
 * @property {...args:any[]} any arguments
 * @return {IDecoratorMetaData<T>} check if any arguments is null or undefined
 */
function hasAnyNullOrUndefined() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    return args.some(function (arg) { return arg === null || arg === undefined; });
}
function mapFromJson(decoratorMetadata, instance, json, key) {
    /**
     * if decorator name is not found, use target property key as decorator name. It means mapping it directly
     */
    var decoratorName = decoratorMetadata.name || key;
    var innerJson = json ? json[decoratorName] : undefined;
    var clazz = getClazz(instance, key);
    if (utils_1.isArrayOrArrayClass(clazz)) {
        var metadata_1 = getJsonProperty(instance, key);
        if (metadata_1 && metadata_1.clazz || utils_1.isPrimitiveOrPrimitiveClass(clazz)) {
            if (innerJson && utils_1.isArrayOrArrayClass(innerJson)) {
                return innerJson.map(function (item) { return deserialize(metadata_1.clazz, item); });
            }
            return;
        }
        else {
            return innerJson;
        }
    }
    if (!utils_1.isPrimitiveOrPrimitiveClass(clazz)) {
        return deserialize(clazz, innerJson);
    }
    return json ? json[decoratorName] : undefined;
}
/**
 * deserialize
 *
 * @function
 * @param {{new():T}} clazz, class type which is going to initialize and hold a mapping json
 * @param {Object} json, input json object which to be mapped
 *
 * @return {T} return mapped object
 */
function deserialize(Clazz, json) {
    /**
     * As it is a recursive function, ignore any arguments that are unset
     */
    if (hasAnyNullOrUndefined(Clazz, json)) {
        return void 0;
    }
    /**
     * Prevent non-json continue
     */
    if (!utils_1.isTargetType(json, 'object')) {
        return void 0;
    }
    /**
     * init root class to contain json
     */
    var instance = new Clazz();
    Object.keys(instance).forEach(function (key) {
        /**
         * get decoratorMetaData, structure: { name?:string, clazz?:{ new():T } }
         */
        var decoratorMetaData = getJsonProperty(instance, key);
        /**
         * pass value to instance
         */
        instance[key] = decoratorMetaData ? mapFromJson(decoratorMetaData, instance, json, key) : json[key];
    });
    return instance;
}
exports.deserialize = deserialize;
//# sourceMappingURL=index.js.map