const { parseJSON } = require('.');
const debug = require('debug')('ea');
module.exports = function(req, res, next) {
    let name = req.params.name;
    let db = req.app.get('db');
    let domain = req.app.get('domain');

    if (name.startsWith('@')) {
        name = name.slice(1);
    }
    name = `${name}@${domain}`;
    debug(`name = ${name}`);

    db.get('select "actor", "outbox" from "accounts", "collections" where "name" = $name', {$name: name}, (err, result) => {
        if (result === undefined) {
            //res.status(404).send(`No record found for ${name}.`);
            next()
        } else {
            if(req.accepts('text/html')) {
                const outbox = parseJSON(result.outbox);
                const posts = outbox.orderedItems.filter((el) => { return el.object.type === 'Note'});
                const actor = result.actor;
                debug(posts);
                res.render('user', { user: actor, posts: JSON.stringify(posts)})
            } else if (req.accepts(['application/activity+json', 'application/ld+json'])) {
                res.contentType('application/ld+json').send(result.actor);
            }
        }
    });
};
