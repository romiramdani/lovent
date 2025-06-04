const db = require('../../config/database');

module.exports = {
    getHomePage: async (req, res) => {
        try {            
            if (!req.session.user) {
                    return res.redirect('/login');         
            }
            res.render('client/index')
        } catch (error) {
            return res.redirect('/login');         
        }
    }
}