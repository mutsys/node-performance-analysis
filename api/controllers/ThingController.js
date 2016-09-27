/**
 * ThingController
 *
 * @description :: Server-side logic for managing things
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  foo: function (req, res) {
    return res.send("foo!");
  },

  stuff: function(req, res) {


    ThingService.doSomething({},
      function(value) {
        res.send(value);
      }
    );

  }

};
