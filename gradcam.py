"""
Grad-CAM for EfficientNet-based brain tumor classification model.
Extracted from the notebook - reuses same preprocessing and target layer.
Standalone reusable module.
"""

import io
import numpy as np
import tensorflow as tf
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from tensorflow import keras


IMG_SIZE = (224, 224)


def find_last_conv_layer(model):
    """Find the last Conv2D layer in the EfficientNet backbone."""
    backbone = model.get_layer("efficientnetb0")

    for layer in reversed(backbone.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            return layer.name

    raise ValueError("No Conv2D layer found in EfficientNet backbone.")


def make_gradcam_heatmap(img_batch, model):
    """
    Compute Grad-CAM heatmap for the model's positive class (tumor).
    Reuses same preprocessing and target layer as the notebook.
    """
    aug = model.get_layer("augmentation")
    backbone = model.get_layer("efficientnetb0")
    drop = model.get_layer("dropout")
    head = model.get_layer("dense")

    last_conv_name = find_last_conv_layer(model)
    last_conv = backbone.get_layer(last_conv_name)

    # Build model that outputs conv + prediction
    backbone_cam = keras.Model(
        inputs=backbone.input,
        outputs=[last_conv.output, backbone.output]
    )

    with tf.GradientTape() as tape:

        # Forward pass exactly like training
        x = aug(model.input)
        conv_out, feats = backbone_cam(x, training=False)
        preds = head(drop(feats, training=False), training=False)

        full_model = keras.Model(model.input, [conv_out, preds])
        conv_out, preds = full_model(img_batch, training=False)

        class_channel = preds[:, 0]

    grads = tape.gradient(class_channel, conv_out)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    conv_out = conv_out[0]
    heatmap = tf.reduce_sum(conv_out * pooled_grads, axis=-1)

    heatmap = tf.maximum(heatmap, 0)
    heatmap /= tf.reduce_max(heatmap) + 1e-8

    return heatmap.numpy()


def get_gradcam_overlay(img_batch, model, alpha=0.35, format="png"):
    """
    Produce Grad-CAM heatmap overlay image as bytes.
    Same preprocessing as notebook show_gradcam_on_image.

    Args:
        img_batch: numpy array shape (1, H, W, 3), float32, 0-255
        model: trained Keras model
        alpha: overlay transparency (0-1)
        format: "png" or "jpeg"

    Returns:
        bytes: PNG/JPEG image bytes
    """
    heatmap = make_gradcam_heatmap(img_batch, model)

    heatmap_resized = tf.image.resize(
        heatmap[..., None], IMG_SIZE
    ).numpy().squeeze()

    # Use first image from batch for display
    img = img_batch[0].astype(np.uint8)

    fig, ax = plt.subplots(1, 1, figsize=(6, 6))
    ax.imshow(img)
    ax.imshow(heatmap_resized, cmap="jet", alpha=alpha)
    ax.set_title("Grad-CAM Overlay")
    ax.axis("off")
    plt.tight_layout(pad=0)

    buf = io.BytesIO()
    plt.savefig(buf, format=format, bbox_inches="tight", pad_inches=0, dpi=100)
    plt.close(fig)
    buf.seek(0)
    return buf.getvalue()


def get_gradcam_overlay_from_path(img_path, model, alpha=0.35, format="png"):
    """
    Load image from path and produce Grad-CAM overlay.
    Same loading as notebook: load_img, img_to_array (float32, 0-255).
    """
    img = keras.utils.load_img(img_path, target_size=IMG_SIZE)
    img_arr = keras.utils.img_to_array(img).astype("float32")
    img_batch = np.expand_dims(img_arr, axis=0)
    return get_gradcam_overlay(img_batch, model, alpha=alpha, format=format)


def get_gradcam_overlay_from_bytes(img_bytes, model, alpha=0.35, format="png"):
    """
    Decode image from bytes and produce Grad-CAM overlay.
    For API use: accepts raw image bytes (JPEG/PNG/etc).
    """
    img = keras.utils.load_img(io.BytesIO(img_bytes), target_size=IMG_SIZE)
    img_arr = keras.utils.img_to_array(img).astype("float32")
    img_batch = np.expand_dims(img_arr, axis=0)
    return get_gradcam_overlay(img_batch, model, alpha=alpha, format=format)
