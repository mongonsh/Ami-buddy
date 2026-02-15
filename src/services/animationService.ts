import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export interface AnimationResponse {
    videoUri: string;
}

export async function generateAnimation(imageUri: string, description?: string): Promise<string | null> {
    try {
        // Use configured URL or fallback to production
        const apiUrl = Constants.expoConfig?.extra?.ANIMATION_API_URL || "https://animation-orchestrator-535548706733.asia-northeast1.run.app/animate";

        if (!apiUrl) {
            console.error('ANIMATION_API_URL is not set');
            throw new Error('Animation API URL is not configured');
        }

        console.log('Generating animation using:', apiUrl);

        const formData = new FormData();

        if (isWeb) {
            // For Web: fetch blob and append
            const res = await fetch(imageUri);
            const blob = await res.blob();
            formData.append('file', blob, 'character.png');
        } else {
            // For Mobile: use uri with file:// scheme (already correct for ImagePicker result usually)
            // Check if it needs 'file://' prefix restoration if missing
            let uri = imageUri;
            if (!uri.startsWith('file://') && !uri.startsWith('http')) {
                uri = 'file://' + uri;
            }

            formData.append('file', {
                uri: uri,
                name: 'character.png',
                type: 'image/png'
            } as any);
        }

        if (description) {
            formData.append('character_description', description);
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
            // Note: Do NOT set Content-Type header when using FormData, 
            // the browser/engine sets it with boundary automatically.
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Animation generation failed:', response.status, errorText);
            throw new Error(`Animation generation failed: ${response.status}`);
        }

        // Response is a video file (blob)
        if (isWeb) {
            const videoBlob = await response.blob();
            return URL.createObjectURL(videoBlob);
        } else {
            // Save to local filesystem
            const timestamp = new Date().getTime();
            const fileUri = `${FileSystem.documentDirectory}animation_${timestamp}.mp4`;

            // We need to read as blob/buffer and write? 
            // Actually, for binary response in React Native without blob support in old versions, 
            // we might use FileSystem.downloadAsync instead.
            // But we are POSTing data.
            // We can use response.blob() -> FileReader -> base64 -> writeAsStringAsync

            const blob = await response.blob();
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onload = async () => {
                    const base64data = (reader.result as string).split(',')[1];
                    await FileSystem.writeAsStringAsync(fileUri, base64data, {
                        encoding: FileSystem.EncodingType.Base64
                    });
                    resolve(fileUri);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }

    } catch (error) {
        return null;
    }
}

export interface SegmentationResponse {
    rig_data: any;
    part_urls: { [key: string]: string };
}

export async function segmentCharacter(imageUri: string): Promise<SegmentationResponse | null> {
    try {
        // Use configured URL or fallback to production
        const apiUrl = Constants.expoConfig?.extra?.ANIMATION_API_URL || "https://animation-orchestrator-535548706733.asia-northeast1.run.app";
        const segmentUrl = `${apiUrl}/segment-character`;

        if (!apiUrl) {
            console.error('ANIMATION_API_URL is not set');
            throw new Error('Animation API URL is not configured');
        }

        console.log('Segmenting character using:', segmentUrl);

        const formData = new FormData();

        if (isWeb) {
            const res = await fetch(imageUri);
            const blob = await res.blob();
            formData.append('file', blob, 'character.png');
        } else {
            let uri = imageUri;
            if (!uri.startsWith('file://') && !uri.startsWith('http')) {
                uri = 'file://' + uri;
            }

            formData.append('file', {
                uri: uri,
                name: 'character.png',
                type: 'image/png'
            } as any);
        }

        const response = await fetch(segmentUrl, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Segmentation failed:', response.status, errorText);
            throw new Error(`Segmentation failed: ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error('Segmentation service error:', error);
        return null;
    }
}
