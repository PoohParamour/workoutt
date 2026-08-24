# Spec: Workout Tracker — Upper/Lower Split (4-Week Mesocycle)

โปรเจกต์: เว็บแอปติดตามโปรแกรมเวท Upper/Lower สำหรับ 1 ผู้ใช้ (ตัวเอง) เล่น 4 วัน/สัปดาห์ (อ-พ-พฤ-ส) มี backend เก็บ progress ข้าม device ได้ deploy บน self-host server ด้วย Dokploy (Docker-based)

---

## 1. เป้าหมายของแอป

- แสดงตารางเวท 4 สัปดาห์แรก แบ่งเป็น Upper (อ, พฤ) / Lower (พ, ส)
- แต่ละท่ามี illustration แบบ SVG line-art (ไม่ใช้รูปลิขสิทธิ์จากเน็ต)
- บอก sets / reps target / เวลาพักต่อเซ็ตชัดเจน (compound vs isolation ต่างกัน)
- กรอกน้ำหนัก+reps ที่ทำได้จริงต่อเซ็ต ผ่านมือถือระหว่างเล่น
- ข้อมูลบันทึกลง backend จริง (ไม่ใช่ localStorage) เพื่อดูจากอุปกรณ์ไหนก็ได้
- มีหน้า Progress สรุปน้ำหนัก/reps ที่ยกได้ของแต่ละท่า เทียบรายสัปดาห์ (กราฟ)
- มีหน้าโน้ตเรื่องโภชนาการสั้นๆ (ขนมปังโฮลวีท+เนยถั่วก่อนเล่น, เวย์+ครีเอทีนหลังเล่น, น้ำมันมะกอกในมื้อปกติ) เป็น reference ในแอป

---

## 2. Tech Stack

**Frontend**
- Static HTML/CSS/JS (vanilla — ไม่ต้องใช้ framework เพราะ scope เล็ก, deploy ง่าย)
- Fetch API เรียก backend endpoints
- Chart แสดง progress: ใช้ Chart.js (โหลดจาก CDN)

**Backend**
- Node.js + Express
- SQLite (ผ่าน `better-sqlite3`) เก็บ log การเล่น — ไฟล์ DB เดียว ไม่ต้องตั้ง DB server แยก เหมาะกับ self-host scale เล็ก
- โปรแกรม 4 สัปดาห์ (ท่า/sets/reps/เวลาพัก) เก็บเป็น static JSON ใน backend ไม่ต้องมี DB table เพราะไม่เปลี่ยนบ่อย

**Deployment (Dokploy)**
- Dockerfile เดียว รัน Node server ที่ serve ทั้ง API และไฟล์ static frontend
- Volume mount สำหรับไฟล์ SQLite กัน data หายตอน redeploy
- Environment variable: `APP_PASSCODE` สำหรับ auth แบบง่าย (single-user, ไม่ต้องทำระบบ login เต็มรูปแบบ — ใส่รหัสผ่านสั้นๆ ครั้งเดียวเก็บใน cookie/localStorage ของ browser นั้น)

---

## 3. Design System

**แนวคิด:** "training ledger" — สมุดจดบันทึกการยกเวทที่ดูจริงจังแบบ scoreboard ไม่ใช่ธีม fitness-app ทั่วไป (หลีกเลี่ยงโทนครีม-terracotta หรือดำ-เขียวนีออนที่เจอบ่อย)

**Palette**
- `--ink: #1C1D21` — พื้นหลังหลัก เกือบดำอมน้ำเงิน
- `--paper: #EDEAE2` — สีตัวอักษร/พื้นผิวการ์ด โทนกระดาษ
- `--steel: #4A5568` — เส้นแบ่ง/พื้นรอง
- `--brass: #C08A3E` — accent เดียว สีทองเหลือง/ทองแดง (อ้างอิงแผ่นเวทเก่า ไม่ใช่ terracotta #D97757)
- `--upper: #6B8CAE` — สีระบุโซน Upper (ฟ้าเหล็ก)
- `--lower: #A8654F` — สีระบุโซน Lower (สนิมเหล็ก)

**Typography**
- Display/หัวข้อ: `Archivo Black` หรือ `Barlow Condensed` (ตัวหนา แน่น เหมือนป้าย gym/scoreboard)
- Body: `Inter` (อ่านง่ายบนมือถือ)
- ตัวเลข (น้ำหนัก/reps/timer): `JetBrains Mono` หรือ `Roboto Mono` — ให้ความรู้สึกเหมือนจอ scoreboard ตัวเลขนิ่งไม่กระโดด

**Layout**
- แท็บสลับ Week 1–4 ด้านบน, ใต้ลงมาสลับ Upper/Lower ตามวันจริงในสัปดาห์นั้น (อ=Upper, พ=Lower, พฤ=Upper, ส=Lower)
- แต่ละท่าเป็นการ์ด: SVG illustration ซ้าย, ชื่อท่า + sets×reps target + เวลาพัก ขวา, ด้านล่างการ์ดมีช่องกรอกน้ำหนัก/reps ต่อเซ็ต (จำนวนช่องตาม sets ของท่านั้น)
- ปุ่ม rest timer นับถอยหลังอัตโนมัติหลังกรอกเซ็ตเสร็จ (2-3 นาที compound, 60-90 วิ isolation)

**Signature element**
- แถบ progress bar เล็กๆ บนสุดของแต่ละท่า แสดง "ทำได้กี่ % ของ target reps สัปดาห์นี้เทียบสัปดาห์ก่อน" เป็นเส้นแบบ scoreboard tick ไม่ใช่ progress bar โค้งมนทั่วไป

---

## 4. โปรแกรม 4 สัปดาห์ (เนื้อหาโปรแกรม)

### Upper (อังคาร, พฤหัส — ท่าเดิมทั้ง 4 สัปดาห์)

| ท่า | ประเภท | Sets×Reps | พักระหว่างเซ็ต |
|---|---|---|---|
| Bench Press | compound | 4×6-10 | 2-3 นาที |
| Barbell Row | compound | 4×6-10 | 2-3 นาที |
| Overhead Press | compound | 3×6-10 | 2-3 นาที |
| Lat Pulldown | compound | 3×8-10 | 2 นาที |
| Lateral Raise | isolation | 3×10-15 | 60-90 วิ |
| Bicep Curl | isolation | 2×10-15 | 60-90 วิ |
| Tricep Pushdown | isolation | 2×10-15 | 60-90 วิ |

### Lower (พุธ, เสาร์ — ท่าเดิมทั้ง 4 สัปดาห์)

| ท่า | ประเภท | Sets×Reps | พักระหว่างเซ็ต |
|---|---|---|---|
| Squat | compound | 4×6-10 | 2-3 นาที |
| Romanian Deadlift | compound | 3×6-10 | 2-3 นาที |
| Leg Press | compound | 3×8-12 | 2 นาที |
| Leg Extension | isolation | 2×10-15 | 60-90 วิ |
| Calf Raise | isolation | 3×12-15 | 60 วิ |
| Plank (วินาที แทน reps) | core | 3×30-60 วิ | 60 วิ |

### กติกา Progression (double progression)

- **สัปดาห์ 1:** เก็บ baseline — ทำเท่าที่ไหวในกรอบ reps ที่กำหนด
- **สัปดาห์ 2-4:** ก่อนเล่นแต่ละท่า ระบบเช็ค log สัปดาห์ก่อน
  - ถ้าสัปดาห์ก่อนทำครบ**บนสุดของ rep range ทุกเซ็ต** → แนะนำเพิ่มน้ำหนัก 2.5-5%
  - ถ้ายังไม่ถึงบนสุด → ให้ค้างน้ำหนักเดิม เน้นเพิ่ม reps ก่อน
  - แสดงคำแนะนำนี้เป็น badge เล็กๆ บนการ์ดท่านั้น (เช่น "แนะนำ: +2.5kg" หรือ "ทำ reps เพิ่มก่อน")

---

## 5. Data Model

```
// Static program data (ไม่เก็บใน DB, hardcode เป็น JSON ใน backend)
Exercise {
  id: string          // "bench_press"
  name: string
  zone: "upper" | "lower"
  type: "compound" | "isolation" | "core"
  sets: number
  rep_range: [min, max]
  rest_seconds: number
  icon: string         // key อ้างอิง SVG illustration
}

// SQLite table: logs
Log {
  id: integer PK
  week: integer        // 1-4
  day: string           // "tue" | "wed" | "thu" | "sat"
  exercise_id: string
  set_number: integer
  weight_kg: real
  reps: integer
  logged_at: datetime
}
```

---

## 6. API Endpoints

```
GET  /api/program
  → คืนโครงสร้างท่าทั้งหมด (Exercise[] ตามตารางข้อ 4)

GET  /api/logs?week=1&exercise_id=bench_press
  → คืน log ทั้งหมดของท่านั้นในสัปดาห์นั้น (เรียง set_number)

POST /api/logs
  body: { week, day, exercise_id, set_number, weight_kg, reps }
  → บันทึก 1 เซ็ต (upsert ถ้ามี week+day+exercise_id+set_number ซ้ำ)

GET  /api/progress/:exercise_id
  → คืนน้ำหนัก/reps สูงสุดต่อสัปดาห์ของท่านั้น (ใช้วาดกราฟ progress)

POST /api/auth
  body: { passcode }
  → เช็คกับ APP_PASSCODE, คืน token/flag เก็บใน localStorage ฝั่ง client
```

---

## 7. หน้าโภชนาการในแอป (เนื้อหา static)

- **ก่อนเล่น (เช้า):** ขนมปังโฮลวีท + เนยถั่ว กิน 60-90 นาทีก่อนเล่น ถ้ามีเวลาน้อยกว่านั้นให้ลดเนยถั่วลง
- **หลังเล่น:** เวย์โปรตีน + ครีเอทีน 3-5 กรัม ผสมแก้วเดียวกันได้ กินได้ทุกวันแม้วันไม่เล่นเวท
- **น้ำมันมะกอก:** ใช้ปรุงมื้อปกติ ไม่ต้องกินใกล้เวลาเล่น

---

## 8. Deployment (Dokploy)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
VOLUME /app/data          # เก็บไฟล์ SQLite ให้รอด redeploy
ENV DB_PATH=/app/data/workout.db
EXPOSE 3000
CMD ["node", "server.js"]
```

- ตั้งค่าใน Dokploy: mount volume ไปที่ `/app/data`, set env `APP_PASSCODE`
- Build จาก Dockerfile นี้ตรงๆ ได้เลย ไม่ต้องมี docker-compose แยกถ้าไม่มี service อื่นร่วม

---

## หมายเหตุ

สเปกนี้ครอบคลุมทุกจุดที่คุยกันไว้ (progression, เวลาพัก, illustration, backend ข้าม device, ธีม) พร้อมส่งให้ผมหรือเครื่องมือ coding อื่น (เช่น Claude Code) เพื่อลงมือ build เป็นโค้ดจริงได้ทันที
