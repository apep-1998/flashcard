"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";
import Box from "@mui/material/Box";
import TextInput from "@/components/forms/TextInput";

type ProfileResponse = {
  name: string;
  email: string;
  avatar_id: number | null;
  avatar_url: string | null;
};

const MOCK_SCORE = 1280;

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await apiFetch(`${getApiBaseUrl()}/api/auth/profile/`);
        if (!response.ok) {
          throw new Error("Unable to load profile.");
        }
        const data = (await response.json()) as ProfileResponse;
        setProfile(data);
        setAvatarUrl(data.avatar_url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load profile.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setError("");
    setMessage("");
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPendingImage(file);
    setPendingPreview(preview);
    setIsCropOpen(true);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const uploadAvatar = async (file: Blob, filename: string) => {
    const formData = new FormData();
    formData.append("file", file, filename);

    try {
      const uploadResponse = await apiFetch(
        `${getApiBaseUrl()}/api/uploads/`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!uploadResponse.ok) {
        throw new Error("Upload failed.");
      }

      const uploadData = (await uploadResponse.json()) as {
        id: number;
        url: string;
      };
      const profileResponse = await apiFetch(
        `${getApiBaseUrl()}/api/auth/profile/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar_id: uploadData.id }),
        },
      );

      if (!profileResponse.ok) {
        throw new Error("Unable to update profile.");
      }

      const updated = (await profileResponse.json()) as ProfileResponse;
      setProfile(updated);
      setAvatarUrl(updated.avatar_url ?? uploadData.url);
      setMessage("Profile picture updated.");
      setIsCropOpen(false);
      setPendingImage(null);
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
      setPendingPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  };

  const getCroppedBlob = async (
    imageSrc: string,
    cropArea: Area,
    mimeType: string,
  ): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas not supported.");
    }

    ctx.drawImage(
      image,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      cropArea.width,
      cropArea.height,
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Unable to crop image."));
          return;
        }
        resolve(blob);
      }, mimeType || "image/png");
    });
  };

  const handleCropAndUpload = async () => {
    if (!pendingImage || !pendingPreview || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedBlob(
        pendingPreview,
        croppedAreaPixels,
        pendingImage.type,
      );
      await uploadAvatar(cropped, pendingImage.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crop failed.");
    }
  };

  const handleUploadOriginal = async () => {
    if (!pendingImage) return;
    await uploadAvatar(pendingImage, pendingImage.name);
  };

  const handleCropComplete = useCallback(
    (_: Area, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels);
    },
    [],
  );

  const handlePasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/auth/change-password/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const fieldMessage =
          data?.current_password?.[0] ||
          data?.new_password?.[0] ||
          data?.confirm_password?.[0];
        throw new Error(
          data?.detail ||
            data?.non_field_errors?.[0] ||
            fieldMessage ||
            "Update failed.",
        );
      }

      setMessage("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="h-24 w-24 overflow-hidden rounded-3xl border border-white/10 bg-white/10">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={`${profile?.name ?? "User"} avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.2em] text-white/60">
                No photo
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold">{profile?.name}</h2>
            <p className="text-sm text-white/60">{profile?.email}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:border-white/30 hover:text-white">
            Change profile picture
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            Score: <span className="text-white">{MOCK_SCORE}</span>
          </div>
        </div>

        {message && (
          <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={handlePasswordSubmit}
        className="rounded-3xl border border-white/10 bg-white/5 p-6"
      >
        <h3 className="text-lg font-semibold">Change password</h3>
        <p className="mt-2 text-sm text-white/60">
          Use a strong password you do not reuse elsewhere.
        </p>

        <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextInput
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="••••••••"
          />
          <TextInput
            label="New password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="••••••••"
          />
          <TextInput
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="••••••••"
          />
        </Box>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
            {message}
          </div>
        )}

        <button
          type="submit"
          className="mt-6 w-full rounded-2xl bg-[#185EA5] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#13508f]"
        >
          Update password
        </button>
      </form>

      {isCropOpen && pendingPreview && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
          <button
            type="button"
            aria-label="Close crop dialog"
            onClick={() => setIsCropOpen(false)}
            className="fixed inset-0 bg-black/70"
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0f141b] p-6">
            <h3 className="text-lg font-semibold">Crop profile photo</h3>
            <p className="mt-2 text-sm text-white/60">
              Crop to a square or upload the original.
            </p>
            <div className="mt-4 flex flex-col items-center gap-4">
              <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
                <Cropper
                  image={pendingPreview}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={handleCropComplete}
                />
              </div>
              <label className="w-full text-sm text-white/70">
                Zoom
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCropAndUpload}
                className="flex-1 rounded-2xl bg-[#185EA5] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#13508f]"
              >
                Crop & upload
              </button>
              <button
                type="button"
                onClick={handleUploadOriginal}
                className="flex-1 rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white/70 transition hover:text-white"
              >
                Upload original
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
