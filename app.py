from flask import Flask, render_template, jsonify, request, send_from_directory
import os
import json
import numpy as np

app = Flask(__name__)

#setting folder for static files
data_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static','data')

@app.route('/')
def index():
    """main page"""
    return render_template('index.html')

@app.route('/realtime')
def realtime():
    """realtime page"""
    return render_template('realtime.html')

@app.route('/words')
def words():
    """pull all words from data folder"""
    words = []
    for filename in os.listdir(data_folder):
        if filename.endswith('.json') and filename != 'summary.json':
            words.append(filename.replace('.json', ''))
    return jsonify(words)

@app.route('/word/<word>')
def get_word_data(word):
    """get word data from json file"""
    file_path = os.path.join(data_folder, f"{word}.json")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 404
    
@app.route('/processed/<word>/<int:video_idx>')
def get_processed_data(word, video_idx):
    """ดึงข้อมูลที่แปลงแล้วของวิดีโอที่ระบุ"""
    file_path = os.path.join(data_folder, f"{word}.json")
    try: 
        with open(file_path, 'r', encoding='wtf-8') as f:
            word_data = json.load(f)
            
        if video_idx >= len(word_data):
            return jsonify({"error": "Video index out of range"}), 404
        
        video_data = word_data[video_idx]
        processed_data = prepare_data_for_3d_model(video_data['landmarks'])
        
        return jsonify(processed_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 404
    
def prepare_data_for_3d_model(landmarks_data):
    """
    แปลงข้อมูลจุดสำคัญให้อยู่ในรูปแบบที่เหมาะสมสำหรับใช้กับโมเดล 3D
    """
    processed_data = []
    
    for frame_data in landmarks_data:
        # ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
        if not frame_data:
            print("Empty frame data found, skipping")
            continue
            
        frame_3d_data = {
            'frame_idx': frame_data.get('frame_idx', 0),
            'hands': [],
            'body': None,
            'face': None
        }
        
        # แปลงข้อมูลมือ
        hands_data = frame_data.get('hands', [])
        if hands_data:
            for hand in hands_data:
                # กรณีรูปแบบข้อมูลเก่า (ก่อนแปลง)
                if isinstance(hand, dict) and 'landmarks' in hand:
                    landmarks = hand['landmarks']
                    is_right = hand.get('is_right', False)
                # กรณีรูปแบบข้อมูลใหม่ (MediaPipe แบบดิบ)
                else:
                    landmarks = hand
                    is_right = False  # ค่าเริ่มต้น
                
                # จัดกลุ่มจุดตามส่วนของมือ
                if landmarks and len(landmarks) >= 21:
                    hand_3d = {
                        'is_right': is_right,
                        'wrist': landmarks[0],
                        'thumb': {
                            'cmc': landmarks[1],
                            'mcp': landmarks[2],
                            'ip': landmarks[3],
                            'tip': landmarks[4]
                        },
                        'index': {
                            'mcp': landmarks[5],
                            'pip': landmarks[6],
                            'dip': landmarks[7],
                            'tip': landmarks[8]
                        },
                        'middle': {
                            'mcp': landmarks[9],
                            'pip': landmarks[10],
                            'dip': landmarks[11],
                            'tip': landmarks[12]
                        },
                        'ring': {
                            'mcp': landmarks[13],
                            'pip': landmarks[14],
                            'dip': landmarks[15],
                            'tip': landmarks[16]
                        },
                        'pinky': {
                            'mcp': landmarks[17],
                            'pip': landmarks[18],
                            'dip': landmarks[19],
                            'tip': landmarks[20]
                        }
                    }
                    
                    frame_3d_data['hands'].append(hand_3d)
        
        # แปลงข้อมูลท่าทาง
        pose_data = frame_data.get('pose')
        if pose_data and len(pose_data) >= 33:
            body_3d = {
                'head': {
                    'nose': pose_data[0],
                    'left_eye': pose_data[2],
                    'right_eye': pose_data[5],
                    'left_ear': pose_data[7],
                    'right_ear': pose_data[8]
                },
                'torso': {
                    'left_shoulder': pose_data[11],
                    'right_shoulder': pose_data[12],
                    'left_hip': pose_data[23],
                    'right_hip': pose_data[24]
                },
                'left_arm': {
                    'shoulder': pose_data[11],
                    'elbow': pose_data[13],
                    'wrist': pose_data[15],
                    'pinky': pose_data[17],
                    'index': pose_data[19],
                    'thumb': pose_data[21]
                },
                'right_arm': {
                    'shoulder': pose_data[12],
                    'elbow': pose_data[14],
                    'wrist': pose_data[16],
                    'pinky': pose_data[18],
                    'index': pose_data[20],
                    'thumb': pose_data[22]
                }
            }
            
            frame_3d_data['body'] = body_3d
        
        # แปลงข้อมูลใบหน้า (ถ้ามี)
        face_data = frame_data.get('face')
        if face_data:
            if isinstance(face_data, list) and len(face_data) > 0:
                # ถ้าเป็น FaceMesh (จำนวนจุดมาก)
                if len(face_data) > 100:
                    face_indices = {
                        'eyebrows': list(range(46, 55)),
                        'eyes': list(range(33, 46)),
                        'nose': list(range(1, 6)),
                        'lips': list(range(61, 72)),
                        'jaw': list(range(100, 111))
                    }
                    
                    face_3d = {}
                    for part, indices in face_indices.items():
                        face_3d[part] = [face_data[i] for i in indices if i < len(face_data)]
                else:
                    # ถ้าเป็นข้อมูลใบหน้าพื้นฐาน
                    face_3d = {
                        'face_landmarks': face_data
                    }
                
                frame_3d_data['face'] = face_3d
        
        processed_data.append(frame_3d_data)
    
    # ตรวจสอบว่ามีข้อมูลที่ประมวลผลแล้วหรือไม่
    if not processed_data:
        print("No processed data produced!")
    else:
        print(f"Processed {len(processed_data)} frames")
    
    return processed_data

# เพิ่ม Route ใน app.py
@app.route('/debug/<word>/<int:video_idx>')
def debug_data(word, video_idx):
    """แสดงข้อมูลดิบของวิดีโอที่ระบุเพื่อการดีบัก"""
    file_path = os.path.join(DATA_FOLDER, f"{word}.json")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            word_data = json.load(f)
        
        if video_idx >= len(word_data):
            return jsonify({"error": "Video index out of range"}), 404
        
        video_data = word_data[video_idx]
        
        # ตรวจสอบโครงสร้างข้อมูล
        sample_frame = None
        if 'landmarks' in video_data and len(video_data['landmarks']) > 0:
            sample_frame = video_data['landmarks'][0]
        
        debug_info = {
            "file_name": video_data.get('file_name', 'unknown'),
            "frame_count": len(video_data.get('landmarks', [])),
            "sample_frame": sample_frame,
            "has_hands": sample_frame and 'hands' in sample_frame and len(sample_frame['hands']) > 0,
            "has_pose": sample_frame and 'pose' in sample_frame and sample_frame['pose'] is not None,
            "has_face": sample_frame and 'face' in sample_frame and sample_frame['face'] is not None
        }
        
        return jsonify(debug_info)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)