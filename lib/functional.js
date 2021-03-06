"use strict";


/**
 * Bind each of an object's methods to itself.
 *
 * @param {Object} subject
 * @return {Object} The object that was passed.
 */
function bindMethods(subject){
	const proto = subject.constructor.prototype;
	const keys = new Set([
		...Object.getOwnPropertyNames(proto),
		...Object.keys(subject)
	]);
	for(const key of keys)
		if("function" === typeof subject[key] && "constructor" !== key)
			subject[key] = subject[key].bind(subject);
	return subject;
}


/**
 * Synchronous, callback-aware version of Promise.all.
 *
 * Functions are resolved using their return values.
 * All other values are resolved normally.
 *
 * An array of values may also be used instead of multiple
 * arguments. The array must be the only argument given.
 *
 * @example chain(() => promise1, "string"…);
 * @param {...*} values
 * @return {Promise}
 */
function chain(...values){
	if(1 === values.length && Array.isArray(values[0]))
		values = [...values[0]];
	
	let promise = Promise.resolve();
	let rejection = null;
	const results = [];
	
	for(const value of values)
		promise = promise.then(result => {
			results.push(result);
			return "function" === typeof value ? value() : value;
		}).catch(error => {
			if(null === rejection)
				rejection = null == error ? true : error;
			return Promise.reject(error);
		});
	
	return promise.then(result => {
		results.push(result);
		results.shift();
		return null !== rejection
			? Promise.reject(rejection)
			: Promise.resolve(results);
	});
}


/**
 * Stop a function from firing too quickly.
 *
 * Returns a copy of the original function that runs only after the designated
 * number of milliseconds have elapsed. Useful for throttling onResize handlers.
 *
 * @param {Function} fn - Function to debounce
 * @param {Number} [limit=0] - Threshold to stall execution by, in milliseconds.
 * @param {Boolean} [asap=false] - Call function *before* threshold elapses, not after.
 * @return {Function}
 */
function debounce(fn, limit = 0, asap = false){
	let started, context, args, timing;
	
	const delayed = function(){
		const timeSince = Date.now() - started;
		if(timeSince >= limit){
			if(!asap) fn.apply(context, args);
			if(timing) clearTimeout(timing);
			timing = context = args = null;
		}
		else timing = setTimeout(delayed, limit - timeSince);
	};
	
	// Debounced copy of original function
	return function(){
		context = this,
		args    = arguments;
		if(!limit)
			return fn.apply(context, args);
		started = Date.now();
		if(!timing){
			if(asap) fn.apply(context, args);
			timing = setTimeout(delayed, limit);
		}
	};
}


/**
 * Generate an exception-proof version of a function.
 *
 * @param {Function} fn
 * @param {Object} [context]
 * @return {Function}
 */
function nerf(fn, context = null){
	if("function" !== typeof fn)
		throw new TypeError("Argument must be a function");
	
	let lastError = null;
	const handler = function(...args){
		let result = null;
		try{result = fn.call(context, ...args)}
		catch(e){lastError = e}
		finally{return result}
	};
	return Object.defineProperty(handler, "lastError", {
		get(){ return lastError; },
		set(e){ lastError = e; }
	});
}


/**
 * Monkey-patch an object's method with another function.
 *
 * @param {Object} subject
 * @param {String} methodName
 * @param {Function} handler
 * @return {Function[]}
 */
function punch(subject, methodName, handler){
	const value = subject[methodName];
	const originalMethod = "function" !== typeof value
		? () => value
		: value;
	
	const punchedMethod = function(){
		const call = () => originalMethod.apply(this, arguments);
		const args = Array.from(arguments);
		return handler.call(this, call, args);
	};
	
	subject[methodName] = punchedMethod;
	return [originalMethod, punchedMethod];
}


/**
 * Return a {@link Promise} which auto-resolves after a delay.
 *
 * @param {Number} [delay=100] - Delay in milliseconds
 * @return {Promise}
 */
function wait(delay = 100){
	return new Promise(resolve => {
		setTimeout(() => resolve(), delay);
	});
}
