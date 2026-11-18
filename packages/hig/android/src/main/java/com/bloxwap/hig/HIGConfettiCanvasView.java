package com.bloxwap.hig;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

/** Draws the seeded particles produced by the shared confetti contract in their original paint order. */
public final class HIGConfettiCanvasView extends View {
  private static final int SQUARE = 0, CIRCLE = 1, STAR = 2;
  private static final Particle[] EMPTY = new Particle[0];
  private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
  private final Path star = new Path();
  private Particle[] particles = EMPTY;
  private double left, top, ticks, decay, drift, gravity, size;
  private boolean flat;
  private double tick = 1;

  private static final class Particle {
    final double dx, dy, wobble, wobbleSpeed, tilt, seed;
    final int color, shape;

    Particle(ReadableMap piece, int[] colors) {
      dx = piece.getDouble("dx");
      dy = piece.getDouble("dy");
      wobble = piece.getDouble("wobble");
      wobbleSpeed = piece.getDouble("wobbleSpeed");
      tilt = piece.getDouble("tilt");
      seed = piece.getDouble("seed");
      color = colors[piece.getInt("color")];
      String kind = piece.getString("shape");
      shape = "star".equals(kind) ? STAR : "circle".equals(kind) ? CIRCLE : SQUARE;
    }
  }

  public HIGConfettiCanvasView(Context context) { super(context); }

  void setBurst(@Nullable ReadableMap burst) {
    if (burst == null) {
      particles = EMPTY;
    } else {
      left = burst.getDouble("left");
      top = burst.getDouble("top");
      ReadableMap physics = burst.getMap("physics");
      ticks = physics.getDouble("ticks");
      decay = physics.getDouble("decay");
      drift = physics.getDouble("drift");
      gravity = physics.getDouble("gravity");
      size = physics.getDouble("size");
      flat = physics.getBoolean("flat");
      ReadableArray palette = burst.getArray("colors");
      int[] colors = new int[palette.size()];
      for (int i = 0; i < colors.length; i++) colors[i] = palette.getInt(i);
      ReadableArray pieces = burst.getArray("particles");
      particles = new Particle[pieces.size()];
      for (int i = 0; i < particles.length; i++) particles[i] = new Particle(pieces.getMap(i), colors);
      // The contract supplies the same star outline used by the web renderer.
      star.rewind();
      ReadableArray points = burst.getArray("starPoints");
      for (int i = 0; i < points.size(); i++) {
        ReadableArray point = points.getArray(i);
        float x = (float) (size * point.getDouble(0)), y = (float) (size * point.getDouble(1));
        if (i == 0) star.moveTo(x, y);
        else star.lineTo(x, y);
      }
      star.close();
    }
    invalidate();
  }

  void setTick(double value) {
    tick = value;
    invalidate();
  }

  @Override protected void onDraw(Canvas canvas) {
    super.onDraw(canvas);
    if (particles.length == 0 || size <= 0) return;
    float density = getResources().getDisplayMetrics().density;
    int saved = canvas.save();
    canvas.scale(density, density);
    double travel = Math.min(1e9, decay == 1 ? tick : (1 - Math.pow(decay, tick)) / (1 - decay));
    double originX = left + drift * tick, originY = top + gravity * tick;
    double alpha = Math.max(0, Math.min(1, 1 - (tick - 1) / ticks));
    // A square can extend from its origin by both flutter axes; the other shapes fit inside this bound.
    double margin = 2 * size + 6;
    double right = getWidth() / density + margin, bottom = getHeight() / density + margin;
    for (Particle piece : particles) {
      double x = originX + piece.dx * travel, y = originY + piece.dy * travel;
      if (x < -margin || y < -margin || x > right || y > bottom) continue;
      paint.setColor(piece.color);
      paint.setAlpha((int) Math.round(Color.alpha(piece.color) * alpha));
      int particleSave = canvas.save();
      canvas.translate((float) x, (float) y);
      drawPiece(canvas, piece);
      canvas.restoreToCount(particleSave);
    }
    canvas.restoreToCount(saved);
  }

  // Mirrors confettiPose in contracts/confetti. The canvas works in points after the density scale.
  private void drawPiece(Canvas canvas, Particle piece) {
    if (piece.shape == STAR) {
      canvas.drawPath(star, paint);
      return;
    }
    double wobble = flat ? 0 : piece.wobble + piece.wobbleSpeed * tick;
    double ux = flat ? size : size * Math.cos(wobble);
    double vy = flat ? size : size * Math.sin(wobble);
    if (piece.shape == CIRCLE) {
      canvas.rotate((float) (18 * wobble));
      float rx = (float) (Math.abs(ux) * 0.6), ry = (float) (Math.abs(vy) * 0.6);
      canvas.drawOval(-rx, -ry, rx, ry, paint);
    } else if (flat) {
      canvas.drawRect(0, 0, (float) size, (float) size, paint);
    } else {
      double tilt = piece.tilt + 0.1 * tick;
      double noise = Math.sin((piece.seed + Math.floor(tick)) * 12.9898) * 43758.5453;
      double flutter = 2 + noise - Math.floor(noise);
      double uy = flutter * Math.sin(tilt), vx = flutter * Math.cos(tilt);
      canvas.translate((float) ((ux + vx) / 2), (float) ((uy + vy) / 2));
      double e = (ux + vy) / 2, f = (ux - vy) / 2, g = (uy + vx) / 2, h = (uy - vx) / 2;
      double q = Math.sqrt(e * e + h * h), r = Math.sqrt(f * f + g * g);
      canvas.rotate((float) Math.toDegrees((Math.atan2(h, e) + Math.atan2(g, f)) / 2));
      float halfWidth = (float) (Math.min(size * 1e6, q + r) / 2);
      float halfHeight = (float) (Math.min(size * 1e6, Math.abs(q - r)) / 2);
      canvas.drawRect(-halfWidth, -halfHeight, halfWidth, halfHeight, paint);
    }
  }
}
