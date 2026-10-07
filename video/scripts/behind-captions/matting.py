import cv2, numpy as np, onnxruntime as ort

def _sess(path):
    so = ort.SessionOptions(); so.intra_op_num_threads = 0
    return ort.InferenceSession(path, so, providers=["CPUExecutionProvider"])

class MODNet:
    def __init__(self, path, ref=512):
        self.s = _sess(path); self.ref = ref
        self.inp = self.s.get_inputs()[0].name
    def __call__(self, rgb):
        h, w = rgb.shape[:2]
        # short side -> ref, both dims multiple of 32
        if min(h, w) != self.ref:
            sc = self.ref / min(h, w)
            nh, nw = int(h * sc), int(w * sc)
        else:
            nh, nw = h, w
        nh, nw = nh - nh % 32, nw - nw % 32
        x = cv2.resize(rgb, (nw, nh), interpolation=cv2.INTER_AREA).astype(np.float32)
        x = (x / 255.0 - 0.5) / 0.5
        x = x.transpose(2, 0, 1)[None]
        a = self.s.run(None, {self.inp: x})[0][0, 0]
        return cv2.resize(a, (w, h), interpolation=cv2.INTER_LINEAR).clip(0, 1)

class ISNet:
    def __init__(self, path, res=1024):
        self.s = _sess(path); self.res = res
        i = self.s.get_inputs()[0]; self.inp = i.name
        self.dtype = np.float16 if "float16" in i.type else np.float32
    def __call__(self, rgb):
        h, w = rgb.shape[:2]
        x = cv2.resize(rgb, (self.res, self.res), interpolation=cv2.INTER_AREA).astype(np.float32)
        x = ((x - 128.0) / 256.0).transpose(2, 0, 1)[None].astype(self.dtype)
        a = self.s.run(None, {self.inp: x})[0].astype(np.float32).reshape(self.res, self.res)
        return cv2.resize(a, (w, h), interpolation=cv2.INTER_LINEAR).clip(0, 1)
