// An SMTP Transaction

var config = require('./config');
var logger = require('./logger');
var Header = require('./mailheader').Header;
var body   = require('./mailbody');

var trans = exports;

function Transaction() {
    this.mail_from = null;
    this.rcpt_to = [];
    this.data_lines = [];
    this.data_bytes = 0;
    this.header_pos = 0;
    this.parse_body = 0;
    this.notes = {};
    this.header = new Header();
}

exports.Transaction = Transaction;

exports.createTransaction = function() {
    var t = new Transaction();
    return t;
};

Transaction.prototype.mail_from = function() {
    if (arguments.length) {
        this.mail_from = arguments[0];
    }
    return this.mail_from;
};

Transaction.prototype.add_data = function(line) {
    this.data_bytes += line.length;
    // check if this is the end of headers line (note the regexp isn't as strong 
    // as it should be - it accepts whitespace in a blank line - we've found this
    // to be a good heuristic rule though).
    if (this.header_pos === 0 && line.match(/^\s*$/)) {
        this.header.parse(this.data_lines);
        this.header_pos = this.data_lines.length;
        if (this.parse_body) {
            this.body = this.body || new body.Body(this.header);
        }
    }
    else if (this.header_pos && this.parse_body) {
        this.body.parse_more(line);
    }
    this.data_lines.push(line);
};

Transaction.prototype.add_header = function(key, value) {
    this.header.add(key, value);
    this.data_lines = this.header.lines().concat(this.data_lines.slice(this.header_pos));
};

Transaction.prototype.attachment_hooks = function (start, data) {
    this.parse_body = 1;
    this.body = this.body || new body.Body(this.header);
    this.body.on('attachment_start', start);
    if (data)
        this.body.on('attachment_data',  data);
};
