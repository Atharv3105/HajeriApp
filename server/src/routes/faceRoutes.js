const express = require('express');
const router = express.Router();
const { getEmbeddingFromBase64, getAllEmbeddingsFromBase64, calculateSimilarity } = require('../ml/faceService');
const { Student, Teacher } = require('../models');

// Request body expects { studentId, imageBase64, name, rollNumber, parentPhone, className, role }
router.post('/enroll', async (req, res) => {
  try {
    const { studentId, imageBase64, name, rollNumber, parentPhone, className, role = 'student' } = req.body;
    
    if (!studentId || !imageBase64) {
      return res.status(400).json({ error: 'Missing studentId or imageBase64' });
    }

    const descriptor = await getEmbeddingFromBase64(imageBase64);
    
    if (role === 'teacher') {
        const phoneKey = parentPhone || phone || ''; // Server might receive either
        // Use upsert-like logic
        const [teacher, created] = await Teacher.findOrCreate({
            where: { id: studentId },
            defaults: {
                name: name || 'Teacher',
                phone: phoneKey,
                face_embedding: JSON.stringify(descriptor)
            }
        });

        if (!created) {
            teacher.name = name || teacher.name;
            if (phoneKey) teacher.phone = phoneKey;
            teacher.face_embedding = JSON.stringify(descriptor);
            await teacher.save();
        }
    } else {
        const [student, created] = await Student.findOrCreate({
            where: { id: studentId },
            defaults: {
                name: name || 'Student',
                roll_number: rollNumber || 0,
                class_name: className || '',
                parent_phone: parentPhone || '',
                face_embedding: JSON.stringify(descriptor)
            }
        });

        if (!created) {
            if (name) student.name = name;
            if (rollNumber) student.roll_number = rollNumber;
            if (className) student.class_name = className;
            if (parentPhone) student.parent_phone = parentPhone;
            student.face_embedding = JSON.stringify(descriptor);
            await student.save();
        }
    }
    
    return res.json({ success: true, message: 'Face Enrolled Successfully!' });

  } catch (error) {
    console.error('Enroll Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Single person verification - Optimized for Global Best Match
router.post('/verify', async (req, res) => {
  try {
    const { imageBase64, threshold = 0.88, className } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Missing imageBase64' });

    const capturedEmbedding = await getEmbeddingFromBase64(imageBase64);
    
    let bestMatch = { id: null, score: 0, role: null };

    // 1. Scan Teachers
    const teachers = await Teacher.findAll();
    for (const t of teachers) {
        if (t.face_embedding) {
            const score = calculateSimilarity(capturedEmbedding, JSON.parse(t.face_embedding));
            if (score > bestMatch.score) {
                bestMatch = { id: t.id, score, role: 'teacher' };
            }
        }
    }

    // 2. Scan Students (Filtering by className if provided for efficiency)
    const queryOptions = className ? { where: { class_name: className } } : {};
    const students = await Student.findAll(queryOptions);
    for (const s of students) {
        if (s.face_embedding) {
            const score = calculateSimilarity(capturedEmbedding, JSON.parse(s.face_embedding));
            if (score > bestMatch.score) {
                bestMatch = { id: s.id, score, role: 'student' };
            }
        }
    }

    // 3. Return the absolute best match found above threshold
    if (bestMatch.score >= threshold) {
      console.log(`[FaceAPI] GLOBAL MATCH: ID=${bestMatch.id} Role=${bestMatch.role} Score=${bestMatch.score.toFixed(3)}`);
      return res.json({ 
          success: true, 
          match: true, 
          studentId: bestMatch.id, 
          role: bestMatch.role, // Explicitly tell the mobile app which role matched
          score: bestMatch.score 
      });
    }

    return res.json({ success: true, match: false });
  } catch (error) {
    if (error.message.includes('No face detected')) return res.json({ success: true, match: false, error: 'No face detected' });
    console.error('Verify Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Bulk verification for classroom photo (NEW)
router.post('/verify-bulk', async (req, res) => {
    try {
        const { imageBase64, className, threshold = 0.70 } = req.body;
        if (!imageBase64 || !className) return res.status(400).json({ error: 'Missing imageBase64 or className' });

        console.log(`[FaceAPI] Bulk verify request for class: ${className}`);

        const allEmbeddings = await getAllEmbeddingsFromBase64(imageBase64);
        if (allEmbeddings.length === 0) {
            console.log(`[FaceAPI] No faces found in classroom photo.`);
            return res.json({ success: true, detectedIds: [] });
        }

        const students = await Student.findAll({ where: { class_name: className } });
        console.log(`[FaceAPI] Comparing against ${students.length} students in class ${className}`);

        const detectedIds = new Set();

        for (const captured of allEmbeddings) {
            let bestMatch = { id: null, name: null, score: 0 };
            for (const student of students) {
                if (student.face_embedding) {
                    const score = calculateSimilarity(captured, JSON.parse(student.face_embedding));
                    if (score > bestMatch.score) {
                        bestMatch = { id: student.id, name: student.name, score };
                    }
                }
            }
            
            if (bestMatch.score >= threshold) {
                console.log(`[FaceAPI] MATCH: ${bestMatch.name} (Score: ${bestMatch.score.toFixed(3)})`);
                detectedIds.add(bestMatch.id);
            } else {
                console.log(`[FaceAPI] UNKNOWN: Best match was ${bestMatch.name} but score ${bestMatch.score.toFixed(3)} is below threshold ${threshold}`);
            }
        }

        console.log(`[FaceAPI] Bulk scan complete. Detected ${detectedIds.size} students.`);
        return res.json({ success: true, detectedIds: Array.from(detectedIds) });
    } catch (error) {
        console.error('Bulk Verify Error:', error);
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;
