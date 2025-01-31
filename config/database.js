const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',      // MySQL 사용자 이름
  password: '********',      // MySQL 비밀번호
  database: 'test',  // 데이터베이스 이름
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 연결 테스트
pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('데이터베이스 연결이 종료되었습니다.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('데이터베이스에 너무 많은 연결이 있습니다.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('데이터베이스 연결이 거부되었습니다.');
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('데이터베이스 접근이 거부되었습니다. 사용자 이름과 비밀번호를 확인하세요.');
    }
    console.error('MySQL 연결 에러:', err);
  }
  if (connection) {
    console.log('MySQL에 성공적으로 연결되었습니다.');
    connection.release();
  }
});

// promise wrapper를 사용하여 async/await 사용 가능하게 설정
const promisePool = pool.promise();

module.exports = promisePool; 
