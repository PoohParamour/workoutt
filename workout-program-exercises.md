# โปรแกรมเวท Upper/Lower — รายละเอียดท่า (อัปเดตล่าสุด)

## Upper (อังคาร, พฤหัส — ท่าเดิมทั้ง 4 สัปดาห์)

| ลำดับ | ท่า | ประเภท | Sets×Reps | พักระหว่างเซ็ต |
|---|---|---|---|---|
| 1 | Flat DB Press | compound (push) | 4×6-10 | 2-3 นาที |
| 2 | Incline DB Press | compound (push) | 3×6-10 | 2-3 นาที |
| 3 | Overhead Press | compound (push) | 3×6-10 | 2-3 นาที |
| 4 | Barbell Row | compound (pull) | 4×6-10 | 2-3 นาที |
| 5 | Lat Pulldown | compound (pull) | 3×8-10 | 2 นาที |
| 6 | Lateral Raise | isolation | 3×10-15 | 60-90 วิ |
| 7 | Bicep Curl | isolation | 2×10-15 | 60-90 วิ |
| 8 | Tricep Pushdown | isolation | 2×10-15 | 60-90 วิ |

เวลารวมโดยประมาณ: 70-80 นาที (working set + rest + transition ระหว่างสถานี)

## Lower (พุธ, เสาร์ — ท่าเดิมทั้ง 4 สัปดาห์)

| ลำดับ | ท่า | ประเภท | Sets×Reps | พักระหว่างเซ็ต |
|---|---|---|---|---|
| 1 | Squat | compound | 4×6-10 | 2-3 นาที |
| 2 | Romanian Deadlift | compound | 3×6-10 | 2-3 นาที |
| 3 | Leg Press | compound | 3×8-12 | 2 นาที |
| 4 | Leg Extension | isolation | 2×10-15 | 60-90 วิ |
| 5 | Calf Raise | isolation | 3×12-15 | 60 วิ |
| 6 | Plank (วินาที แทน reps) | core | 3×30-60 วิ | 60 วิ |

## กติกา Progression (double progression) — ใช้เหมือนกันทุกท่า

- **สัปดาห์ 1:** เก็บ baseline — ทำเท่าที่ไหวในกรอบ reps ที่กำหนด
- **สัปดาห์ 2-4:** เช็ค log สัปดาห์ก่อนของท่านั้นก่อนเล่น
  - ทำครบ**บนสุดของ rep range ทุกเซ็ต** ในสัปดาห์ก่อน → เพิ่มน้ำหนัก 2.5-5% ในสัปดาห์นี้
  - ยังไม่ถึงบนสุด → น้ำหนักเดิม เน้นเพิ่ม reps ก่อน

## Exercise data (สำหรับใส่ในโค้ด/backend)

```json
[
  { "id": "flat_db_press", "name": "Flat DB Press", "zone": "upper", "type": "compound", "sets": 4, "rep_range": [6, 10], "rest_seconds": 150 },
  { "id": "incline_db_press", "name": "Incline DB Press", "zone": "upper", "type": "compound", "sets": 3, "rep_range": [6, 10], "rest_seconds": 150 },
  { "id": "overhead_press", "name": "Overhead Press", "zone": "upper", "type": "compound", "sets": 3, "rep_range": [6, 10], "rest_seconds": 150 },
  { "id": "barbell_row", "name": "Barbell Row", "zone": "upper", "type": "compound", "sets": 4, "rep_range": [6, 10], "rest_seconds": 150 },
  { "id": "lat_pulldown", "name": "Lat Pulldown", "zone": "upper", "type": "compound", "sets": 3, "rep_range": [8, 10], "rest_seconds": 120 },
  { "id": "lateral_raise", "name": "Lateral Raise", "zone": "upper", "type": "isolation", "sets": 3, "rep_range": [10, 15], "rest_seconds": 75 },
  { "id": "bicep_curl", "name": "Bicep Curl", "zone": "upper", "type": "isolation", "sets": 2, "rep_range": [10, 15], "rest_seconds": 75 },
  { "id": "tricep_pushdown", "name": "Tricep Pushdown", "zone": "upper", "type": "isolation", "sets": 2, "rep_range": [10, 15], "rest_seconds": 75 },

  { "id": "squat", "name": "Squat", "zone": "lower", "type": "compound", "sets": 4, "rep_range": [6, 10], "rest_seconds": 150 },
  { "id": "romanian_deadlift", "name": "Romanian Deadlift", "zone": "lower", "type": "compound", "sets": 3, "rep_range": [6, 10], "rest_seconds": 150 },
  { "id": "leg_press", "name": "Leg Press", "zone": "lower", "type": "compound", "sets": 3, "rep_range": [8, 12], "rest_seconds": 120 },
  { "id": "leg_extension", "name": "Leg Extension", "zone": "lower", "type": "isolation", "sets": 2, "rep_range": [10, 15], "rest_seconds": 75 },
  { "id": "calf_raise", "name": "Calf Raise", "zone": "lower", "type": "isolation", "sets": 3, "rep_range": [12, 15], "rest_seconds": 60 },
  { "id": "plank", "name": "Plank", "zone": "lower", "type": "core", "sets": 3, "rep_range": [30, 60], "rest_seconds": 60, "unit": "seconds" }
]
```
