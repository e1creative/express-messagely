/** User class for message.ly */

const db = require("../db");
const bcrypt = require('bcrypt')
const { BCRYPT_WORK_FACTOR } = require('../config')
const ExpressError = require("../expressError");


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    if (!username || !password || !first_name || !last_name || !phone){
        throw new ExpressError("Please provide the required information!", 400)
    }

    const hashedPw = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)

    const result = await db.query(`
        INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
          VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
          RETURNING *`, 
        [username, hashedPw, first_name, last_name, phone])
    
    return (result.rows[0])
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    if (!username || !password){
      throw new ExpressError("Please provide a username and password!", 401)
    }

    const result = await db.query(`
      SELECT username, password
      FROM users
      WHERE username = $1`, [username])
      
    const user = result.rows[0];
    
    if (!user){
        throw new ExpressError('Username not found!', 400)
    }

    return await bcrypt.compare(password, user.password);
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const result = await db.query(`
      UPDATE users SET last_login_at=current_timestamp
      WHERE username=$1
    `, [username])
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const results = await db.query(`
      SELECT username, first_name, last_name, phone
      FROM users
     `)
    return (results.rows)
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const result = await db.query(`
      SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username=$1
     `, [username])
    
    if (!result.rows[0]) {
      throw new ExpressError(`No such user: ${id}`, 404);
    }

    return (result.rows[0])
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    const messages = await db.query(`
      SELECT id, to_username, body, sent_at, read_at
      FROM messages
      WHERE from_username=$1
    `, [username])

    if (messages.rows.length === 0) {
      throw new ExpressError('No messages to show.', 404);
    }

    return (messages.rows)
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    const messages = await db.query(`
      SELECT id, to_username, body, sent_at, read_at
      FROM messages
      WHERE from_username=$1
    `, [username])

    if (messages.rows.length === 0) {
      throw new ExpressError('No messages to show.', 404);
    }

    return (messages.rows)
  }
}


module.exports = User;