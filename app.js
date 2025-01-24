const express = require('express');
const path = require('path');
const db = require('./config/database');
const app = express();
// 환경 변수에서 포트를 가져오거나 기본값 사용
const port = process.env.PORT || 3000;

// body-parser 미들웨어 추가
app.use(express.json());

// API 라우트들
// 사용자 등록 API
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, phone, birthdate } = req.body;
    
    // 입력값 검증
    if (!name || !email || !phone || !birthdate) {
      return res.status(400).json({ 
        success: false, 
        error: '이름, 이메일, 전화번호, 생년월일은 필수 입력값입니다.' 
      });
    }

    // 사용자 등록
    const [result] = await db.query(
      'INSERT INTO users (name, email, phone, birthdate) VALUES (?, ?, ?, ?)',
      [name, email, phone, birthdate]
    );

    // 등록된 사용자 정보 조회
    const [users] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ 
      success: true, 
      message: '사용자가 성공적으로 등록되었습니다.',
      data: users[0]
    });
  } catch (err) {
    console.error('사용자 등록 오류:', err);
    // 중복 이메일 에러 처리
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: '이미 등록된 이메일 주소입니다.'
      });
    }
    res.status(500).json({ 
      success: false, 
      error: '사용자 등록 실패',
      details: err.message 
    });
  }
});

// 사용자 목록 조회 API
app.get('/api/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    // 전체 사용자 수 조회
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = countResult[0].total;
    const totalPages = Math.ceil(totalUsers / limit);

    // 페이지별 사용자 조회
    const [users] = await db.query(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.json({ 
      success: true, 
      data: users,
      pagination: {
        total: totalUsers,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (err) {
    console.error('사용자 조회 오류:', err);
    res.status(500).json({ 
      success: false, 
      error: '사용자 조회 실패',
      details: err.message 
    });
  }
});

// 사용자 수정 API
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, birthdate } = req.body;
    
    // 입력값 검증
    if (!name || !email || !phone || !birthdate) {
      return res.status(400).json({ 
        success: false, 
        error: '이름, 이메일, 전화번호, 생년월일은 필수 입력값입니다.' 
      });
    }

    // 사용자 존재 여부 확인
    const [existing] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }

    // 사용자 정보 업데이트
    await db.query(
      'UPDATE users SET name = ?, email = ?, phone = ?, birthdate = ? WHERE id = ?',
      [name, email, phone, birthdate, id]
    );

    // 업데이트된 사용자 정보 조회
    const [users] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    res.json({ 
      success: true, 
      message: '사용자 정보가 성공적으로 수정되었습니다.',
      data: users[0]
    });
  } catch (err) {
    console.error('사용자 수정 오류:', err);
    // 중복 이메일 에러 처리
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: '이미 등록된 이메일 주소입니다.'
      });
    }
    res.status(500).json({ 
      success: false, 
      error: '사용자 수정 실패',
      details: err.message 
    });
  }
});

// 사용자 삭제 API
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 사용자 존재 여부 확인
    const [existing] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }

    // 사용자 삭제
    await db.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({ 
      success: true, 
      message: '사용자가 성공적으로 삭제되었습니다.'
    });
  } catch (err) {
    console.error('사용자 삭제 오류:', err);
    res.status(500).json({ 
      success: false, 
      error: '사용자 삭제 실패',
      details: err.message 
    });
  }
});

// 정적 파일 제공을 위한 미들웨어 설정
app.use(express.static('public'));

// 루트 경로로 접근시 index.html 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) {
      console.error('파일 전송 오류:', err);
      res.status(500).send('서버 오류가 발생했습니다.');
    }
  });
});

// MySQL 연결 테스트
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    console.log('쿼리 결과:', rows);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('데이터베이스 쿼리 오류:', err);
    res.status(500).json({ 
      success: false, 
      error: '데이터베이스 오류',
      details: err.message 
    });
  }
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error('서버 오류:', err);
  res.status(500).json({
    success: false,
    error: '서버 오류가 발생했습니다.'
  });
});

// 서버 시작
app.listen(port, '0.0.0.0', (err) => {
  if (err) {
    console.error('서버 시작 오류:', err);
    return;
  }
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
}).on('error', (err) => {
  console.error('서버 리스닝 오류:', err);
}); 