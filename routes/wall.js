
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('wall', { title: 'Live Wall' });
};
