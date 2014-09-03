/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 *
 */
 
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define(["require"], function(require){
		//___________________________________________ RANGE RELATED
	return {
		createRangeObject : function(start, end, total, count, results, query) {
			var res = {
				_deep_range_: true,
				total: total,
				count: count,
				results: results,
				start: 0,
				end: 0,
				hasNext: false,
				hasPrevious: false,
				query: query || ""
			};

			function update(start, end, total) {
				this.total = total || this.total || 0;
				if (this.total === 0) {
					this.start = this.end = 0;
					return this;
				}
				this.start = start; // Math.max(Math.min(this.total-1,start), 0);
				this.end = end; //Math.max(Math.min(end, this.total-1),0);
				this.hasNext = (this.end < (this.total - 1));
				this.hasPrevious = (this.start > 0);
				//console.log("update range  : res : ",this);
				return this;
			}
			update.call(res, start, end, total);
			return res;
		}
	};
});