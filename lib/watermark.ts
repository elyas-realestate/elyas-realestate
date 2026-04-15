/**
 * مكتبة إضافة العلامات المائية للصور برمجياً باستخدام Canvas
 * تستخدم لحفظ حقوق الوسيط العقاري
 */

export async function applyWatermark(
  imageFile: File,
  watermarkText: string = "وسيط برو"
): Promise<File> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const objUrl = URL.createObjectURL(imageFile);

      img.onload = async () => {
        URL.revokeObjectURL(objUrl);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(imageFile);

        canvas.width = img.width;
        canvas.height = img.height;

        // رسم الصورة الأصلية
        ctx.drawImage(img, 0, 0);

        // إعدادات الخط للعلامة المائية
        const baseFontSize = Math.max(24, Math.floor(canvas.width * 0.04));
        ctx.font = `bold ${baseFontSize}px 'Cairo', sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)"; // شبه شفاف
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // إضافة ظل للنص لضمان بروزه على كافة الخلفيات
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const xPos = canvas.width / 2;
        const yPosList = [
          canvas.height * 0.25,
          canvas.height * 0.5,
          canvas.height * 0.75,
        ];

        // طباعة النص في 3 أماكن عشوائية أفقياً وموزعة عمودياً
        yPosList.forEach((y, i) => {
          // حركة أفقية طفيفة لكسر النمط
          const offset = i === 1 ? 0 : (i === 0 ? -canvas.width * 0.1 : canvas.width * 0.1);
          
          ctx.save();
          ctx.translate(xPos + offset, y);
          ctx.rotate(-Math.PI / 6); // دوران بسيط (30 درجة مائلة)
          ctx.fillText(watermarkText, 0, 0);
          ctx.restore();
        });

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(imageFile);
            const watermarkedFile = new File([blob], imageFile.name, {
              type: imageFile.type,
              lastModified: Date.now(),
            });
            resolve(watermarkedFile);
          },
          imageFile.type,
          0.9 // Quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        resolve(imageFile); // في حال فشل تحميل الصورة للصنباص نعيد الملف الأصلي
      };

      img.src = objUrl;
    } catch (err) {
      console.error("Watermark failed", err);
      resolve(imageFile);
    }
  });
}
