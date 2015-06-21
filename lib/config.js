/**
 * Created by jay on 6/20/2015.
 */

var _ = require('lodash');
exports.settings = _.merge(require('../config/public.settings.json'), require('../config/private.settings.json'));