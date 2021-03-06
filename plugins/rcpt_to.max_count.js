// Implement a maximum number of recipients per mail
// this helps guard against some spammers who send RCPT TO a gazillion times
// as a way of probing for a working address

exports.hook_rcpt = function (callback, connection) {
    if (connection.transaction.notes.rcpt_to_count) {
        connection.transaction.notes.rcpt_to_count++;
    }
    else {
        connection.transaction.notes.rcpt_to_count = 1;
    }
    
    var max_count = this.config.get('rcpt_to.max_count') || 40;
    
    if (connection.transaction.notes.rcpt_to_count > max_count) {
        return callback(DENYDISCONNECT, "Too many recipient attempts");
    }
    return callback(CONT);
};
