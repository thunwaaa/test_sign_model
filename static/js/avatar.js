/**
 * AvatarModel - คลาสสำหรับสร้างและจัดการโมเดล 3D
 */
class AvatarModel {
  /**
   * สร้างโมเดล 3D
   * @param {THREE.Scene} scene - ฉาก Three.js
   * @param {string} type - ประเภทของโมเดล ('simple' หรือ 'custom')
   * @param {string} modelPath - พาธไปยังไฟล์โมเดล GLB (กรณีใช้โมเดลสำเร็จรูป)
   */
  constructor(scene, type = "simple", modelPath = null) {
    this.scene = scene;
    this.type = type;
    this.modelPath = modelPath;
    this.model = new THREE.Group();
    this.scene.add(this.model);

    this.isModelLoaded = false;

    if (type === "simple") {
      this.createSimpleModel();
    } else if (type === "custom" && modelPath) {
      this.loadCustomModel(modelPath);
    }
  }

  /**
   * สร้างโมเดลแบบง่าย (ตัวการ์ตูนแบบพื้นฐาน)
   */
  createSimpleModel() {
    // สีมาตรฐาน
    this.skinColor = 0xffcc99;
    this.clothColor = 0x3388ff;

    this.createBody();
    this.createHead();
    this.createArms();
    this.createHands();

    this.isModelLoaded = true;
  }

  /**
   * โหลดโมเดลสำเร็จรูปจากไฟล์ GLB/GLTF
   * @param {string} modelPath - พาธไปยังไฟล์โมเดล
   */
  loadCustomModel(modelPath) {
    const loader = new THREE.GLTFLoader();

    loader.load(
      modelPath,
      (gltf) => {
        this.customModel = gltf.scene;
        this.model.add(this.customModel);

        // จัดการกับแอนิเมชัน (ถ้ามี)
        this.mixer = new THREE.AnimationMixer(this.customModel);
        this.animations = gltf.animations;

        // หาโครงกระดูก (Bones) ของโมเดล
        this.findSkeletonBones();

        this.isModelLoaded = true;
        console.log("โหลดโมเดลสำเร็จ");
      },
      (xhr) => {
        console.log(
          `กำลังโหลด ${((xhr.loaded / xhr.total) * 100).toFixed(0)}%`
        );
      },
      (error) => {
        console.error("เกิดข้อผิดพลาดในการโหลดโมเดล:", error);
      }
    );
  }

  /**
   * ค้นหาโครงกระดูกของโมเดลสำเร็จรูป
   */
  findSkeletonBones() {
    this.bones = {
      head: null,
      neck: null,
      spine: null,
      leftArm: null,
      leftForeArm: null,
      leftHand: null,
      leftHandThumb: null,
      leftHandIndex: null,
      leftHandMiddle: null,
      leftHandRing: null,
      leftHandPinky: null,
      rightArm: null,
      rightForeArm: null,
      rightHand: null,
      rightHandThumb: null,
      rightHandIndex: null,
      rightHandMiddle: null,
      rightHandRing: null,
      rightHandPinky: null,
    };

    // ค้นหาโครงกระดูกในโมเดล
    if (this.customModel) {
      this.customModel.traverse((object) => {
        if (object.isBone || object.type === "Bone") {
          const name = object.name.toLowerCase();

          // หัวและคอ
          if (name.includes("head")) {
            this.bones.head = object;
          } else if (name.includes("neck")) {
            this.bones.neck = object;
          } else if (name.includes("spine")) {
            this.bones.spine = object;
          }

          // แขนซ้าย
          else if (
            (name.includes("left") &&
              name.includes("arm") &&
              !name.includes("fore")) ||
            (name.includes("l") &&
              name.includes("arm") &&
              !name.includes("fore"))
          ) {
            this.bones.leftArm = object;
          } else if (
            (name.includes("left") && name.includes("forearm")) ||
            (name.includes("l") && name.includes("forearm"))
          ) {
            this.bones.leftForeArm = object;
          }

          // มือซ้าย
          else if (
            (name.includes("left") &&
              name.includes("hand") &&
              !name.includes("thumb") &&
              !name.includes("index") &&
              !name.includes("middle") &&
              !name.includes("ring") &&
              !name.includes("pinky")) ||
            (name.includes("l") &&
              name.includes("hand") &&
              !name.includes("thumb") &&
              !name.includes("index") &&
              !name.includes("middle") &&
              !name.includes("ring") &&
              !name.includes("pinky"))
          ) {
            this.bones.leftHand = object;
          }

          // นิ้วมือซ้าย
          else if (
            (name.includes("left") && name.includes("thumb")) ||
            (name.includes("l") && name.includes("thumb"))
          ) {
            this.bones.leftHandThumb = this.bones.leftHandThumb || [];
            this.bones.leftHandThumb.push(object);
          } else if (
            (name.includes("left") && name.includes("index")) ||
            (name.includes("l") && name.includes("index"))
          ) {
            this.bones.leftHandIndex = this.bones.leftHandIndex || [];
            this.bones.leftHandIndex.push(object);
          } else if (
            (name.includes("left") && name.includes("middle")) ||
            (name.includes("l") && name.includes("middle"))
          ) {
            this.bones.leftHandMiddle = this.bones.leftHandMiddle || [];
            this.bones.leftHandMiddle.push(object);
          } else if (
            (name.includes("left") && name.includes("ring")) ||
            (name.includes("l") && name.includes("ring"))
          ) {
            this.bones.leftHandRing = this.bones.leftHandRing || [];
            this.bones.leftHandRing.push(object);
          } else if (
            (name.includes("left") && name.includes("pinky")) ||
            (name.includes("l") && name.includes("pinky")) ||
            (name.includes("left") && name.includes("little")) ||
            (name.includes("l") && name.includes("little"))
          ) {
            this.bones.leftHandPinky = this.bones.leftHandPinky || [];
            this.bones.leftHandPinky.push(object);
          }

          // แขนขวา
          else if (
            (name.includes("right") &&
              name.includes("arm") &&
              !name.includes("fore")) ||
            (name.includes("r") &&
              name.includes("arm") &&
              !name.includes("fore"))
          ) {
            this.bones.rightArm = object;
          } else if (
            (name.includes("right") && name.includes("forearm")) ||
            (name.includes("r") && name.includes("forearm"))
          ) {
            this.bones.rightForeArm = object;
          }

          // มือขวา
          else if (
            (name.includes("right") &&
              name.includes("hand") &&
              !name.includes("thumb") &&
              !name.includes("index") &&
              !name.includes("middle") &&
              !name.includes("ring") &&
              !name.includes("pinky")) ||
            (name.includes("r") &&
              name.includes("hand") &&
              !name.includes("thumb") &&
              !name.includes("index") &&
              !name.includes("middle") &&
              !name.includes("ring") &&
              !name.includes("pinky"))
          ) {
            this.bones.rightHand = object;
          }

          // นิ้วมือขวา
          else if (
            (name.includes("right") && name.includes("thumb")) ||
            (name.includes("r") && name.includes("thumb"))
          ) {
            this.bones.rightHandThumb = this.bones.rightHandThumb || [];
            this.bones.rightHandThumb.push(object);
          } else if (
            (name.includes("right") && name.includes("index")) ||
            (name.includes("r") && name.includes("index"))
          ) {
            this.bones.rightHandIndex = this.bones.rightHandIndex || [];
            this.bones.rightHandIndex.push(object);
          } else if (
            (name.includes("right") && name.includes("middle")) ||
            (name.includes("r") && name.includes("middle"))
          ) {
            this.bones.rightHandMiddle = this.bones.rightHandMiddle || [];
            this.bones.rightHandMiddle.push(object);
          } else if (
            (name.includes("right") && name.includes("ring")) ||
            (name.includes("r") && name.includes("ring"))
          ) {
            this.bones.rightHandRing = this.bones.rightHandRing || [];
            this.bones.rightHandRing.push(object);
          } else if (
            (name.includes("right") && name.includes("pinky")) ||
            (name.includes("r") && name.includes("pinky")) ||
            (name.includes("right") && name.includes("little")) ||
            (name.includes("r") && name.includes("little"))
          ) {
            this.bones.rightHandPinky = this.bones.rightHandPinky || [];
            this.bones.rightHandPinky.push(object);
          }
        }
      });

      console.log(
        "พบโครงกระดูก:",
        Object.keys(this.bones).filter((key) => this.bones[key] !== null)
      );
    }
  }

  /**
   * สร้างส่วนลำตัว
   */
  createBody() {
    // สร้างลำตัว
    const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.5, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: this.clothColor,
    });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 0.5;
    this.model.add(this.body);

    // สร้างเอว
    const hipGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8);
    const hipMaterial = new THREE.MeshPhongMaterial({ color: 0x222266 });
    this.hip = new THREE.Mesh(hipGeometry, hipMaterial);
    this.hip.position.y = 0.2;
    this.model.add(this.hip);
  }

  /**
   * สร้างส่วนศีรษะ
   */
  createHead() {
    // สร้างคอ
    const neckGeometry = new THREE.CylinderGeometry(0.07, 0.08, 0.1, 8);
    const neckMaterial = new THREE.MeshPhongMaterial({ color: this.skinColor });
    this.neck = new THREE.Mesh(neckGeometry, neckMaterial);
    this.neck.position.y = 0.8;
    this.model.add(this.neck);

    // สร้างหัว
    const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ color: this.skinColor });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.y = 1.0;
    this.model.add(this.head);

    // สร้างตา
    const eyeGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });

    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(-0.08, 1.02, 0.16);
    this.model.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(0.08, 1.02, 0.16);
    this.model.add(this.rightEye);

    // สร้างปาก
    const mouthGeometry = new THREE.BoxGeometry(0.1, 0.02, 0.01);
    const mouthMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    this.mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    this.mouth.position.set(0, 0.92, 0.18);
    this.model.add(this.mouth);
  }

  /**
   * สร้างส่วนแขน
   */
  createArms() {
    // วัสดุสำหรับแขน
    const armMaterial = new THREE.MeshPhongMaterial({ color: this.clothColor });

    // สร้างแขนซ้าย
    const leftUpperArmGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
    this.leftUpperArm = new THREE.Mesh(leftUpperArmGeometry, armMaterial);
    this.leftUpperArm.position.set(-0.3, 0.65, 0);
    this.leftUpperArm.rotation.z = Math.PI / 2;
    this.model.add(this.leftUpperArm);

    const leftLowerArmGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
    this.leftLowerArm = new THREE.Mesh(leftLowerArmGeometry, armMaterial);
    this.leftLowerArm.position.set(-0.55, 0.65, 0);
    this.leftLowerArm.rotation.z = Math.PI / 2;
    this.model.add(this.leftLowerArm);

    // สร้างแขนขวา
    const rightUpperArmGeometry = new THREE.CylinderGeometry(
      0.05,
      0.05,
      0.3,
      8
    );
    this.rightUpperArm = new THREE.Mesh(rightUpperArmGeometry, armMaterial);
    this.rightUpperArm.position.set(0.3, 0.65, 0);
    this.rightUpperArm.rotation.z = -Math.PI / 2;
    this.model.add(this.rightUpperArm);

    const rightLowerArmGeometry = new THREE.CylinderGeometry(
      0.04,
      0.04,
      0.3,
      8
    );
    this.rightLowerArm = new THREE.Mesh(rightLowerArmGeometry, armMaterial);
    this.rightLowerArm.position.set(0.55, 0.65, 0);
    this.rightLowerArm.rotation.z = -Math.PI / 2;
    this.model.add(this.rightLowerArm);
  }

  /**
   * สร้างส่วนมือ
   */
  createHands() {
    // วัสดุสำหรับมือ
    const handMaterial = new THREE.MeshPhongMaterial({ color: this.skinColor });

    // สร้างมือซ้าย
    const leftHandGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.03);
    this.leftHand = new THREE.Mesh(leftHandGeometry, handMaterial);
    this.leftHand.position.set(-0.7, 0.65, 0);
    this.model.add(this.leftHand);

    // สร้างนิ้วมือซ้าย
    this.leftFingers = this.createFingers(-0.7, 0.65, 0, false);

    // สร้างมือขวา
    const rightHandGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.03);
    this.rightHand = new THREE.Mesh(rightHandGeometry, handMaterial);
    this.rightHand.position.set(0.7, 0.65, 0);
    this.model.add(this.rightHand);

    // สร้างนิ้วมือขวา
    this.rightFingers = this.createFingers(0.7, 0.65, 0, true);
  }

  /**
   * สร้างนิ้วมือ
   */
  createFingers(x, y, z, isRight) {
    const fingerMaterial = new THREE.MeshPhongMaterial({
      color: this.skinColor,
    });
    const fingers = [];

    // สร้างนิ้วทั้ง 5 นิ้ว
    const fingerPositions = [
      [0, 0.08, 0], // นิ้วโป้ง
      [0, 0.04, 0], // นิ้วชี้
      [0, 0, 0], // นิ้วกลาง
      [0, -0.04, 0], // นิ้วนาง
      [0, -0.08, 0], // นิ้วก้อย
    ];

    for (let i = 0; i < 5; i++) {
      const finger = new THREE.Group();
      const posX = isRight ? x + 0.05 : x - 0.05;
      const posY = y + fingerPositions[i][1];
      const posZ = z + fingerPositions[i][2];

      // แต่ละนิ้วประกอบด้วย 3 ข้อ
      const joints = [];
      for (let j = 0; j < 3; j++) {
        const segmentGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.04);
        const segment = new THREE.Mesh(segmentGeometry, fingerMaterial);

        // ตำแหน่งของแต่ละข้อนิ้ว
        const jointX = posX + (isRight ? 1 : -1) * j * 0.03;
        segment.position.set(jointX, posY, posZ);

        this.model.add(segment);
        joints.push(segment);
      }

      finger.joints = joints;
      fingers.push(finger);
    }

    return fingers;
  }

  /**
   * อัปเดตโมเดลตามข้อมูลจุดสำคัญ
   * @param {Object} landmarksData - ข้อมูลจุดสำคัญ
   */
  update(landmarksData) {
    if (!this.isModelLoaded) {
      console.warn("Model not loaded yet");
      return;
    }

    if (!landmarksData) {
      console.warn("No landmarks data provided");
      return;
    }

    console.log("Updating model with data:", landmarksData);

    // เลือกวิธีการอัปเดตตามประเภทโมเดล
    if (this.type === "simple") {
      this.updateSimpleModel(landmarksData);
    } else if (this.type === "custom" && this.customModel) {
      this.updateCustomModel(landmarksData);
    }
  }

  /**
   * อัปเดตโมเดลแบบง่าย
   * @param {Object} landmarksData - ข้อมูลจุดสำคัญ
   */
  updateSimpleModel(landmarksData) {
    // อัปเดตตำแหน่งและการหมุนของศีรษะ
    if (landmarksData.body && landmarksData.body.head) {
      const nose = landmarksData.body.head.nose;
      const leftEye = landmarksData.body.head.left_eye;
      const rightEye = landmarksData.body.head.right_eye;

      // คำนวณทิศทางการมอง
      const eyeCenter = [
        (leftEye[0] + rightEye[0]) / 2,
        (leftEye[1] + rightEye[1]) / 2,
        (leftEye[2] + rightEye[2]) / 2,
      ];

      const lookDir = [
        nose[0] - eyeCenter[0],
        nose[1] - eyeCenter[1],
        nose[2] - eyeCenter[2],
      ];

      // อัปเดตการหมุนของหัว
      this.head.lookAt(
        this.head.position.x + lookDir[0],
        this.head.position.y + lookDir[1],
        this.head.position.z + lookDir[2]
      );
    }

    // อัปเดตแขนและมือตามข้อมูลจาก MediaPipe
    this.updateArmsAndHands(landmarksData);

    // อัปเดตการแสดงออกทางสีหน้า (ถ้ามี)
    if (landmarksData.face) {
      this.updateFacialExpression(landmarksData.face);
    }
  }

  /**
   * อัปเดตโมเดลสำเร็จรูป
   * @param {Object} landmarksData - ข้อมูลจุดสำคัญ
   */
  updateCustomModel(landmarksData) {
    // อัปเดตโมเดลสำเร็จรูปโดยใช้โครงกระดูก

    // อัปเดตศีรษะ
    if (landmarksData.body && landmarksData.body.head && this.bones.head) {
      const nose = landmarksData.body.head.nose;
      const leftEye = landmarksData.body.head.left_eye;
      const rightEye = landmarksData.body.head.right_eye;

      // คำนวณทิศทางการมอง
      const eyeCenter = [
        (leftEye[0] + rightEye[0]) / 2,
        (leftEye[1] + rightEye[1]) / 2,
        (leftEye[2] + rightEye[2]) / 2,
      ];

      const lookDir = [
        nose[0] - eyeCenter[0],
        nose[1] - eyeCenter[1],
        nose[2] - eyeCenter[2],
      ];

      // คำนวณการหมุนของหัว
      const headRotation = new THREE.Quaternion();
      const headPosition = new THREE.Vector3(
        this.bones.head.position.x + lookDir[0] * 0.1,
        this.bones.head.position.y + lookDir[1] * 0.1,
        this.bones.head.position.z + lookDir[2] * 0.1
      );
      this.bones.head.lookAt(headPosition);
    }

    // อัปเดตแขนและมือ
    this.updateCustomArmAndHand(landmarksData, "left");
    this.updateCustomArmAndHand(landmarksData, "right");

    // อัปเดต Mixer สำหรับแอนิเมชัน
    if (this.mixer) {
      this.mixer.update(0.016); // อัปเดตประมาณ 60 fps
    }
  }

  /**
   * อัปเดตแขนและมือของโมเดลสำเร็จรูป
   * @param {Object} landmarksData - ข้อมูลจุดสำคัญ
   * @param {string} side - ด้าน ('left' หรือ 'right')
   */
  updateCustomArmAndHand(landmarksData, side) {
    const isLeft = side === "left";
    const armBone = isLeft ? this.bones.leftArm : this.bones.rightArm;
    const foreArmBone = isLeft
      ? this.bones.leftForeArm
      : this.bones.rightForeArm;
    const handBone = isLeft ? this.bones.leftHand : this.bones.rightHand;

    // ดึงข้อมูลแขนและมือจาก landmarks
    let armData = null;
    let handData = null;

    if (landmarksData.body) {
      armData = isLeft
        ? landmarksData.body.left_arm
        : landmarksData.body.right_arm;
    }

    if (landmarksData.hands && landmarksData.hands.length > 0) {
      handData = landmarksData.hands.find((h) => h.is_right !== isLeft);
    }

    // อัปเดตแขน
    if (armData && armBone && foreArmBone) {
      const shoulder = armData.shoulder;
      const elbow = armData.elbow;
      const wrist = armData.wrist;

      // คำนวณทิศทางของแขนส่วนบน
      const upperArmDir = [
        elbow[0] - shoulder[0],
        elbow[1] - shoulder[1],
        elbow[2] - shoulder[2],
      ];

      // คำนวณทิศทางของแขนส่วนล่าง
      const lowerArmDir = [
        wrist[0] - elbow[0],
        wrist[1] - elbow[1],
        wrist[2] - elbow[2],
      ];

      // อัปเดตการหมุนของแขนส่วนบน
      if (armBone) {
        const upperArmQuat = new THREE.Quaternion();
        const upperArmPos = new THREE.Vector3(
          armBone.position.x + upperArmDir[0],
          armBone.position.y + upperArmDir[1],
          armBone.position.z + upperArmDir[2]
        );
        armBone.lookAt(upperArmPos);
      }

      // อัปเดตการหมุนของแขนส่วนล่าง
      if (foreArmBone) {
        const lowerArmQuat = new THREE.Quaternion();
        const lowerArmPos = new THREE.Vector3(
          foreArmBone.position.x + lowerArmDir[0],
          foreArmBone.position.y + lowerArmDir[1],
          foreArmBone.position.z + lowerArmDir[2]
        );
        foreArmBone.lookAt(lowerArmPos);
      }
    }

    // อัปเดตมือและนิ้ว
    if (handData && handBone) {
      this.updateCustomHand(handData, side);
    }
  }

  /**
   * อัปเดตมือของโมเดลสำเร็จรูป
   * @param {Object} handData - ข้อมูลมือ
   * @param {string} side - ด้าน ('left' หรือ 'right')
   */
  updateCustomHand(handData, side) {
    const isLeft = side === "left";

    // อัปเดตนิ้วโป้ง
    this.updateCustomFinger(
      handData.thumb,
      isLeft ? this.bones.leftHandThumb : this.bones.rightHandThumb
    );

    // อัปเดตนิ้วชี้
    this.updateCustomFinger(
      handData.index,
      isLeft ? this.bones.leftHandIndex : this.bones.rightHandIndex
    );

    // อัปเดตนิ้วกลาง
    this.updateCustomFinger(
      handData.middle,
      isLeft ? this.bones.leftHandMiddle : this.bones.rightHandMiddle
    );

    // อัปเดตนิ้วนาง
    this.updateCustomFinger(
      handData.ring,
      isLeft ? this.bones.leftHandRing : this.bones.rightHandRing
    );

    // อัปเดตนิ้วก้อย
    this.updateCustomFinger(
      handData.pinky,
      isLeft ? this.bones.leftHandPinky : this.bones.rightHandPinky
    );
  }

  /**
   * อัปเดตนิ้วของโมเดลสำเร็จรูป
   * @param {Object} fingerData - ข้อมูลนิ้ว
   * @param {Array} fingerBones - โครงกระดูกของนิ้ว
   */
  updateCustomFinger(fingerData, fingerBones) {
    if (
      !fingerData ||
      !fingerBones ||
      !Array.isArray(fingerBones) ||
      fingerBones.length === 0
    ) {
      return;
    }

    // อัปเดตแต่ละข้อของนิ้ว
    for (let i = 0; i < fingerBones.length && i < 3; i++) {
      const bone = fingerBones[i];
      let startPoint, endPoint;

      // เลือกจุดเริ่มต้นและจุดสิ้นสุดตามข้อนิ้ว
      if (i === 0) {
        // ข้อแรก
        startPoint = fingerData.mcp || fingerData.cmc;
        endPoint = fingerData.pip || fingerData.mcp;
      } else if (i === 1) {
        // ข้อกลาง
        startPoint = fingerData.pip || fingerData.mcp;
        endPoint = fingerData.dip || fingerData.ip;
      } else {
        // ข้อปลาย
        startPoint = fingerData.dip || fingerData.ip;
        endPoint = fingerData.tip;
      }

      if (startPoint && endPoint && bone) {
        // คำนวณทิศทางของข้อนิ้ว
        const dir = [
          endPoint[0] - startPoint[0],
          endPoint[1] - startPoint[1],
          endPoint[2] - startPoint[2],
        ];

        // อัปเดตการหมุนของข้อนิ้ว
        const fingerPos = new THREE.Vector3(
          bone.position.x + dir[0],
          bone.position.y + dir[1],
          bone.position.z + dir[2]
        );
        bone.lookAt(fingerPos);
      }
    }
  }

  /**
   * อัปเดตแขนและมือของโมเดลแบบง่าย
   * @param {Object} landmarksData - ข้อมูลจุดสำคัญ
   */
  updateArmsAndHands(landmarksData) {
    // อัปเดตตำแหน่งและการหมุนของแขน
    if (landmarksData.body) {
      // อัปเดตแขนซ้าย
      if (landmarksData.body.left_arm) {
        const shoulder = landmarksData.body.left_arm.shoulder;
        const elbow = landmarksData.body.left_arm.elbow;
        const wrist = landmarksData.body.left_arm.wrist;

        // อัปเดตตำแหน่งและการหมุนของแขนซ้าย
        this.updateArm(
          this.leftUpperArm,
          this.leftLowerArm,
          shoulder,
          elbow,
          wrist,
          false
        );
      }

      // อัปเดตแขนขวา
      if (landmarksData.body.right_arm) {
        const shoulder = landmarksData.body.right_arm.shoulder;
        const elbow = landmarksData.body.right_arm.elbow;
        const wrist = landmarksData.body.right_arm.wrist;

        // อัปเดตตำแหน่งและการหมุนของแขนขวา
        this.updateArm(
          this.rightUpperArm,
          this.rightLowerArm,
          shoulder,
          elbow,
          wrist,
          true
        );
      }
    }

    // อัปเดตมือซ้าย
    const leftHand = landmarksData.hands.find((h) => !h.is_right);
    if (leftHand) {
      this.updateHand(this.leftHand, this.leftFingers, leftHand, false);
    }

    // อัปเดตมือขวา
    const rightHand = landmarksData.hands.find((h) => h.is_right);
    if (rightHand) {
      this.updateHand(this.rightHand, this.rightFingers, rightHand, true);
    }
  }

  /**
   * อัปเดตแขน
   * @param {THREE.Mesh} upperArm - แขนส่วนบน
   * @param {THREE.Mesh} lowerArm - แขนส่วนล่าง
   * @param {Array} shoulder - พิกัดไหล่
   * @param {Array} elbow - พิกัดข้อศอก
   * @param {Array} wrist - พิกัดข้อมือ
   * @param {boolean} isRight - เป็นแขนขวาหรือไม่
   */
  updateArm(upperArm, lowerArm, shoulder, elbow, wrist, isRight) {
    // คำนวณทิศทางและความยาวของส่วนบนของแขน
    const upperArmDir = [
      elbow[0] - shoulder[0],
      elbow[1] - shoulder[1],
      elbow[2] - shoulder[2],
    ];

    const upperArmLength = Math.sqrt(
      upperArmDir[0] * upperArmDir[0] +
        upperArmDir[1] * upperArmDir[1] +
        upperArmDir[2] * upperArmDir[2]
    );

    // คำนวณทิศทางและความยาวของส่วนล่างของแขน
    const lowerArmDir = [
      wrist[0] - elbow[0],
      wrist[1] - elbow[1],
      wrist[2] - elbow[2],
    ];

    const lowerArmLength = Math.sqrt(
      lowerArmDir[0] * lowerArmDir[0] +
        lowerArmDir[1] * lowerArmDir[1] +
        lowerArmDir[2] * lowerArmDir[2]
    );

    // ปรับความยาวของแขน
    upperArm.scale.y = upperArmLength * 4;
    lowerArm.scale.y = lowerArmLength * 4;

    // อัปเดตตำแหน่งของศอก
    const shoulderPos = new THREE.Vector3(isRight ? 0.2 : -0.2, 0.75, 0);

    const elbowPos = new THREE.Vector3(
      shoulderPos.x + upperArmDir[0] * 4,
      shoulderPos.y + upperArmDir[1] * 4,
      shoulderPos.z + upperArmDir[2] * 4
    );

    const wristPos = new THREE.Vector3(
      elbowPos.x + lowerArmDir[0] * 4,
      elbowPos.y + lowerArmDir[1] * 4,
      elbowPos.z + lowerArmDir[2] * 4
    );

    // อัปเดตตำแหน่งของส่วนบนของแขน
    upperArm.position.copy(shoulderPos);
    upperArm.lookAt(elbowPos);
    upperArm.rotateX(Math.PI / 2);

    // อัปเดตตำแหน่งของส่วนล่างของแขน
    lowerArm.position.copy(elbowPos);
    lowerArm.lookAt(wristPos);
    lowerArm.rotateX(Math.PI / 2);

    // อัปเดตตำแหน่งของมือ
    if (isRight) {
      this.rightHand.position.copy(wristPos);
    } else {
      this.leftHand.position.copy(wristPos);
    }
  }

  /**
   * อัปเดตมือ
   * @param {THREE.Mesh} hand - มือ
   * @param {Array} fingers - นิ้ว
   * @param {Object} handData - ข้อมูลมือ
   * @param {boolean} isRight - เป็นมือขวาหรือไม่
   */
  updateHand(hand, fingers, handData, isRight) {
    // ตำแหน่งข้อมือ
    const wrist = handData.wrist;

    // อัปเดตการหมุนของมือโดยใช้ทิศทางจากฝ่ามือ
    const palmDir = this.calculatePalmDirection(handData);
    hand.lookAt(
      hand.position.x + palmDir[0],
      hand.position.y + palmDir[1],
      hand.position.z + palmDir[2]
    );

    // อัปเดตนิ้วแต่ละนิ้ว
    this.updateFinger(fingers[0], handData.thumb, wrist, isRight);
    this.updateFinger(fingers[1], handData.index, wrist, isRight);
    this.updateFinger(fingers[2], handData.middle, wrist, isRight);
    this.updateFinger(fingers[3], handData.ring, wrist, isRight);
    this.updateFinger(fingers[4], handData.pinky, wrist, isRight);
  }

  /**
   * อัปเดตนิ้ว
   * @param {Object} finger - นิ้ว
   * @param {Object} fingerData - ข้อมูลนิ้ว
   * @param {Array} wrist - พิกัดข้อมือ
   * @param {boolean} isRight - เป็นมือขวาหรือไม่
   */
  updateFinger(finger, fingerData, wrist, isRight) {
    if (!finger || !fingerData) return;

    // ดึงข้อต่อของนิ้ว
    const joints = finger.joints;

    // ดึงตำแหน่งของแต่ละข้อนิ้ว
    const knuckle = fingerData.mcp || fingerData.cmc;
    const middle = fingerData.pip || fingerData.mcp;
    const tip = fingerData.tip;

    // คำนวณทิศทางของแต่ละส่วนของนิ้ว
    const dir1 = [
      knuckle[0] - wrist[0],
      knuckle[1] - wrist[1],
      knuckle[2] - wrist[2],
    ];

    const dir2 = [
      middle[0] - knuckle[0],
      middle[1] - knuckle[1],
      middle[2] - knuckle[2],
    ];

    const dir3 = [tip[0] - middle[0], tip[1] - middle[1], tip[2] - middle[2]];

    // อัปเดตตำแหน่งและการหมุนของแต่ละข้อนิ้ว
    const wristPos = new THREE.Vector3(isRight ? 0.7 : -0.7, 0.65, 0);

    if (joints[0]) {
      const knucklePos = new THREE.Vector3(
        wristPos.x + dir1[0] * 5,
        wristPos.y + dir1[1] * 5,
        wristPos.z + dir1[2] * 5
      );
      joints[0].position.copy(knucklePos);
      joints[0].lookAt(
        knucklePos.x + dir2[0],
        knucklePos.y + dir2[1],
        knucklePos.z + dir2[2]
      );
    }

    if (joints[1]) {
      const middlePos = new THREE.Vector3(
        wristPos.x + dir1[0] * 5 + dir2[0] * 5,
        wristPos.y + dir1[1] * 5 + dir2[1] * 5,
        wristPos.z + dir1[2] * 5 + dir2[2] * 5
      );
      joints[1].position.copy(middlePos);
      joints[1].lookAt(
        middlePos.x + dir3[0],
        middlePos.y + dir3[1],
        middlePos.z + dir3[2]
      );
    }

    if (joints[2]) {
      const tipPos = new THREE.Vector3(
        wristPos.x + dir1[0] * 5 + dir2[0] * 5 + dir3[0] * 5,
        wristPos.y + dir1[1] * 5 + dir2[1] * 5 + dir3[1] * 5,
        wristPos.z + dir1[2] * 5 + dir2[2] * 5 + dir3[2] * 5
      );
      joints[2].position.copy(tipPos);
      joints[2].lookAt(
        tipPos.x + dir3[0],
        tipPos.y + dir3[1],
        tipPos.z + dir3[2]
      );
    }
  }

  /**
   * คำนวณทิศทางของฝ่ามือ
   * @param {Object} handData - ข้อมูลมือ
   * @returns {Array} ทิศทางของฝ่ามือ
   */
  calculatePalmDirection(handData) {
    // คำนวณทิศทางของฝ่ามือโดยใช้ผลเฉลี่ยของเวกเตอร์ตั้งฉากกับฝ่ามือ
    const wrist = handData.wrist;
    const indexMcp = handData.index.mcp;
    const pinkyMcp = handData.pinky.mcp;
    const middleMcp = handData.middle.mcp;

    // คำนวณเวกเตอร์ 2 เวกเตอร์บนระนาบฝ่ามือ
    const v1 = [
      indexMcp[0] - wrist[0],
      indexMcp[1] - wrist[1],
      indexMcp[2] - wrist[2],
    ];

    const v2 = [
      pinkyMcp[0] - wrist[0],
      pinkyMcp[1] - wrist[1],
      pinkyMcp[2] - wrist[2],
    ];

    // คำนวณเวกเตอร์ตั้งฉากกับระนาบฝ่ามือ (cross product)
    const normal = [
      v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0],
    ];

    // ปรับให้เป็นเวกเตอร์หนึ่งหน่วย
    const length = Math.sqrt(
      normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]
    );

    return [normal[0] / length, normal[1] / length, normal[2] / length];
  }

  /**
   * อัปเดตการแสดงออกทางสีหน้า
   * @param {Object} faceData - ข้อมูลใบหน้า
   */
  updateFacialExpression(faceData) {
    // ถ้าไม่มีข้อมูลหรือใช้โมเดลสำเร็จรูป ไม่ต้องทำอะไร
    if (!faceData || this.type !== "simple") return;

    // ตรวจสอบสีหน้าเฉพาะเมื่อมีข้อมูลริมฝีปาก
    if (faceData.lips) {
      // คำนวณระยะห่างระหว่างมุมปากซ้ายและขวา (ตรวจสอบการยิ้ม)
      const lipCorners = this.calculateLipWidth(faceData.lips);
      const lipHeight = this.calculateLipHeight(faceData.lips);

      // ตรวจสอบการยิ้ม (มุมปากกว้างกว่าปกติ)
      if (lipCorners > 0.2) {
        // ปรับปากให้ยิ้ม (กว้างขึ้นและยกขึ้น)
        this.mouth.scale.x = 1.5;
        this.mouth.position.y = 0.94;
      } else if (lipHeight < -0.1) {
        // ปรับปากให้เศร้า (หุบลง)
        this.mouth.scale.x = 0.8;
        this.mouth.position.y = 0.9;
        this.mouth.rotation.z = 0.1;
      } else {
        // ปากปกติ
        this.mouth.scale.x = 1.0;
        this.mouth.position.y = 0.92;
        this.mouth.rotation.z = 0;
      }
    }

    // ตรวจสอบการขมวดคิ้ว
    if (faceData.eyebrows) {
      const eyebrowHeight = this.calculateEyebrowHeight(faceData.eyebrows);
      if (eyebrowHeight < -0.1) {
        // ขมวดคิ้ว - สร้างคิ้วด้วย Three.js ถ้ายังไม่มี
        if (!this.eyebrows) {
          const geometry = new THREE.BoxGeometry(0.05, 0.01, 0.01);
          const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
          this.leftEyebrow = new THREE.Mesh(geometry, material);
          this.rightEyebrow = new THREE.Mesh(geometry, material);
          this.model.add(this.leftEyebrow);
          this.model.add(this.rightEyebrow);
          this.eyebrows = true;
        }

        // ปรับตำแหน่งคิ้วให้ขมวด
        this.leftEyebrow.position.set(-0.08, 1.1, 0.18);
        this.leftEyebrow.rotation.z = 0.2;
        this.rightEyebrow.position.set(0.08, 1.1, 0.18);
        this.rightEyebrow.rotation.z = -0.2;
      } else if (eyebrowHeight > 0.1) {
        // ยกคิ้ว
        if (this.eyebrows) {
          this.leftEyebrow.position.set(-0.08, 1.15, 0.18);
          this.leftEyebrow.rotation.z = 0;
          this.rightEyebrow.position.set(0.08, 1.15, 0.18);
          this.rightEyebrow.rotation.z = 0;
        }
      }
    }
  }

  /**
   * คำนวณความกว้างของริมฝีปาก (สำหรับตรวจสอบการยิ้ม)
   * @param {Array} lips - ข้อมูลริมฝีปาก
   * @returns {number} ความกว้างเชิงเปรียบเทียบ
   */
  calculateLipWidth(lips) {
    // ตรวจสอบว่ามีข้อมูลเพียงพอหรือไม่
    if (!lips || lips.length < 8) return 0;

    // ใช้จุดที่เป็นมุมปากซ้ายและขวา (ตำแหน่งอาจต้องปรับตามโครงสร้างข้อมูล)
    const leftCorner = lips[0]; // มุมปากซ้าย
    const rightCorner = lips[6]; // มุมปากขวา

    // คำนวณระยะห่างระหว่างมุมปาก
    const distance = Math.sqrt(
      Math.pow(rightCorner[0] - leftCorner[0], 2) +
        Math.pow(rightCorner[1] - leftCorner[1], 2) +
        Math.pow(rightCorner[2] - leftCorner[2], 2)
    );

    return distance;
  }

  /**
   * คำนวณความสูงของริมฝีปาก (สำหรับตรวจสอบการเศร้า)
   * @param {Array} lips - ข้อมูลริมฝีปาก
   * @returns {number} ความสูงเชิงเปรียบเทียบ
   */
  calculateLipHeight(lips) {
    // ตรวจสอบว่ามีข้อมูลเพียงพอหรือไม่
    if (!lips || lips.length < 8) return 0;

    // ใช้จุดกลางริมฝีปากบนและล่าง
    const topLip = lips[3]; // จุดกลางริมฝีปากบน
    const bottomLip = lips[9]; // จุดกลางริมฝีปากล่าง

    // คำนวณระยะห่างตามแนวดิ่ง
    return topLip[1] - bottomLip[1];
  }

  /**
   * คำนวณความสูงของคิ้ว
   * @param {Array} eyebrows - ข้อมูลคิ้ว
   * @returns {number} ความสูงเชิงเปรียบเทียบ
   */
  calculateEyebrowHeight(eyebrows) {
    // ตรวจสอบว่ามีข้อมูลเพียงพอหรือไม่
    if (!eyebrows || eyebrows.length < 4) return 0;

    // ใช้จุดกลางคิ้ว
    const middlePoint = eyebrows[Math.floor(eyebrows.length / 2)];

    // คำนวณความสูงเทียบกับค่าอ้างอิง (ค่าต้องปรับให้เหมาะสม)
    return middlePoint[1] - 0.5; // สมมติว่า 0.5 คือตำแหน่งปกติ
  }
}
