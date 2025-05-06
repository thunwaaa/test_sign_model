from flask import Flask, render_template, jsonify, request, send_from_directory, abort
import os
import json
import numpy as np
import logging

app = Flask(__name__)

# เพิ่มใน app.py หลังจากสร้าง app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['TEMPLATES_AUTO_RELOAD'] = True

logging.basicConfig(level=logging.INFO)
app.logger.setLevel(logging.INFO)

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
    app.logger.info(f"Accessing file: {file_path}")
    
    try:
        if not os.path.exists(file_path):
            app.logger.error(f"File not found: {file_path}")
            return jsonify({"error": f"File not found: {word}.json"}), 404
            
        with open(file_path, 'r', encoding='utf-8') as f:
            word_data = json.load(f)
        
        if video_idx >= len(word_data):
            return jsonify({"error": "Video index out of range"}), 404
        
        video_data = word_data[video_idx]
        
        # ตรวจสอบว่ามีข้อมูล landmarks หรือไม่
        if 'landmarks' not in video_data or not video_data['landmarks']:
            return jsonify({"error": "No landmarks data found"}), 400
            
        # ประมวลผลข้อมูลและส่งกลับ
        processed_data = prepare_data_for_3d_model(video_data['landmarks'])
        return jsonify(processed_data)
        
    except Exception as e:
        app.logger.error(f"Error processing data: {str(e)}")
        return jsonify({"error": str(e)}), 500

    
def prepare_data_for_3d_model(landmarks_data):
    """
    แปลงข้อมูลจุดสำคัญให้อยู่ในรูปแบบที่เหมาะสมสำหรับใช้กับโมเดล 3D
    """
    processed_data = []
    
    for frame_data in landmarks_data:
        frame_3d_data = {
            'frame_idx': frame_data.get('frame_idx', 0),
            'hands': [],
            'body': None,
            'face': None
        }
        
        # แปลงข้อมูลมือ
        if 'hands' in frame_data and frame_data['hands']:
            for hand in frame_data['hands']:
                # ตรวจสอบว่าเป็นข้อมูลมือที่มี landmarks หรือไม่
                if isinstance(hand, dict) and 'landmarks' in hand:
                    landmarks = hand['landmarks']
                    is_right = hand.get('is_right', False)
                elif isinstance(hand, list) and len(hand) >= 21:
                    # กรณีที่เป็นรายการจุด
                    landmarks = hand
                    is_right = False  # ค่าเริ่มต้น
                else:
                    continue
                
                # จัดกลุ่มจุดมือตามโครงสร้าง
                if len(landmarks) >= 21:
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
        if 'pose' in frame_data and frame_data['pose'] and len(frame_data['pose']) >= 33:
            pose = frame_data['pose']
            body_3d = {
                'head': {
                    'nose': pose[0][:3],  # ตัดค่า visibility ออก
                    'left_eye': pose[2][:3],
                    'right_eye': pose[5][:3],
                    'left_ear': pose[7][:3],
                    'right_ear': pose[8][:3]
                },
                'torso': {
                    'left_shoulder': pose[11][:3],
                    'right_shoulder': pose[12][:3],
                    'left_hip': pose[23][:3],
                    'right_hip': pose[24][:3]
                },
                'left_arm': {
                    'shoulder': pose[11][:3],
                    'elbow': pose[13][:3],
                    'wrist': pose[15][:3],
                    'pinky': pose[17][:3],
                    'index': pose[19][:3],
                    'thumb': pose[21][:3]
                },
                'right_arm': {
                    'shoulder': pose[12][:3],
                    'elbow': pose[14][:3],
                    'wrist': pose[16][:3],
                    'pinky': pose[18][:3],
                    'index': pose[20][:3],
                    'thumb': pose[22][:3]
                }
            }
            frame_3d_data['body'] = body_3d
        
        # แปลงข้อมูลใบหน้า
        if 'face' in frame_data and frame_data['face']:
            face_data = frame_data['face']
            # ตรวจสอบว่าเป็นรายการของจุดหรือไม่
            if isinstance(face_data, list):
                # ถ้าเป็น FaceMesh (จำนวนจุดมาก)
                if len(face_data) > 100:
                    # ใช้ดัชนีจุดสำคัญของใบหน้า (อาจต้องปรับ)
                    face_indices = {
                        'eyebrows': list(range(46, 55)),
                        'eyes': list(range(33, 46)),
                        'nose': list(range(1, 6)),
                        'lips': list(range(61, 72)),
                        'jaw': list(range(100, min(111, len(face_data))))
                    }
                    
                    face_3d = {}
                    for part, indices in face_indices.items():
                        face_3d[part] = [face_data[i][:3] for i in indices if i < len(face_data)]
                else:
                    # ถ้าเป็นข้อมูลใบหน้าพื้นฐาน
                    face_3d = {
                        'face_landmarks': [pt[:3] for pt in face_data[:min(100, len(face_data))]]
                    }
                
                frame_3d_data['face'] = face_3d
        
        processed_data.append(frame_3d_data)
    
    return processed_data


# เพิ่ม route เพื่อเข้าถึงไฟล์ JSON โดยตรง
@app.route('/static/data/<filename>')
def serve_data_file(filename):
    """ให้เข้าถึงไฟล์ JSON โดยตรง"""
    try:
        return send_from_directory(data_folder, filename)
    except Exception as e:
        app.logger.error(f"Error serving file {filename}: {str(e)}")
        abort(404)

# เพิ่ม Route ใน app.py
@app.route('/debug/<word>/<int:video_idx>')
def debug_data(word, video_idx):
    """แสดงข้อมูลดิบของวิดีโอที่ระบุเพื่อการดีบัก"""
    file_path = os.path.join(data_folder, f"{word}.json")
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
    
@app.route('/list_data')
def list_data():
    """แสดงรายการไฟล์ในโฟลเดอร์ data"""
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'data')
    files = []
    if os.path.exists(data_dir):
        files = os.listdir(data_dir)
    
    return jsonify({
        "data_directory": data_dir,
        "exists": os.path.exists(data_dir),
        "files": files,
        "readable": [f for f in files if os.access(os.path.join(data_dir, f), os.R_OK)]
    })

@app.route('/peek/<word>')
def peek_data(word):
    """แสดงตัวอย่างข้อมูลของคำที่ระบุ"""
    file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'data', f"{word}.json")
    
    if not os.path.exists(file_path):
        return jsonify({"error": f"File not found: {file_path}"}), 404
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return jsonify({
            "file": file_path,
            "size": os.path.getsize(file_path),
            "type": type(data).__name__,
            "length": len(data) if isinstance(data, list) else "N/A",
            "sample": data[0] if isinstance(data, list) and len(data) > 0 else data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/check_data/<word>')
def check_data(word):
    """ตรวจสอบข้อมูลคำ"""
    
    file_path = os.path.join(data_folder, f"{word}.json")
    
    if not os.path.exists(file_path):
        return jsonify({"error": f"File not found: {file_path}"}), 404
        
    file_info = {
        "exists": os.path.exists(file_path),
        "size": os.path.getsize(file_path) if os.path.exists(file_path) else 0,
        "readable": os.access(file_path, os.R_OK) if os.path.exists(file_path) else False,
        "writable": os.access(file_path, os.W_OK) if os.path.exists(file_path) else False
    }
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        data_info = {
            "type": type(data).__name__,
            "length": len(data) if isinstance(data, list) else "not a list",
            "first_item_keys": list(data[0].keys()) if isinstance(data, list) and len(data) > 0 else "N/A",
            "has_landmarks": "landmarks" in data[0] if isinstance(data, list) and len(data) > 0 else False,
            "landmarks_length": len(data[0].get("landmarks", [])) if isinstance(data, list) and len(data) > 0 else 0
        }
        
        return jsonify({"file_info": file_info, "data_info": data_info})
    except Exception as e:
        return jsonify({"file_info": file_info, "error": str(e)}), 500
# เพิ่มใน app.py
@app.after_request
def add_header(response):
    response.cache_control.no_store = True
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

if __name__ == '__main__':
    app.run(debug=True)