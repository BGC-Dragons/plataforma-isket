import {
  postStorageGenerateSignedUrl,
  type IGenerateSignedUrlRequest,
  type TypeUpload,
} from "../post-storage-generate-signed-url.service";
import {
  postStorageMakeObjectPublic,
  type IMakeObjectPublicRequest,
} from "../post-storage-make-object-public.service";

export interface IUploadProfilePhotoResult {
  publicUrl: string;
  success: boolean;
  error?: string;
}

export const uploadProfilePhoto = async (
  token: string,
  _file: File,
  _userId: string,
  _accountId: string,
  typeUpload: TypeUpload = "USER_PROFILE_IMG"
): Promise<IUploadProfilePhotoResult> => {
  try {
    // 1. Gerar nome único para o arquivo (sempre JPG como na plataforma antiga)
    const timestamp = Date.now();
    const filename = `profile_${timestamp}.jpg`;

    // 2. Obter URL assinada da API da plataforma
    const signedUrlRequest: IGenerateSignedUrlRequest = {
      filename,
      typeUpload,
      contentType: "image/jpeg", // Sempre JPEG como na plataforma antiga
    };

    const signedUrlResponse = await postStorageGenerateSignedUrl(
      token,
      signedUrlRequest
    );
    const { signedUrl, publicUrl } = signedUrlResponse.data;

    console.log("🔍 Debug - signedUrl recebida:", signedUrl);
    console.log("🔍 Debug - publicUrl recebida:", publicUrl);

    // 3. Upload direto para GCS usando signedUrl (frontend faz o upload)
    console.log("🚀 Iniciando upload direto para GCS...");
    const uploadResponse = await fetch(signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "image/jpeg",
      },
      body: _file,
    });

    if (!uploadResponse.ok) {
      throw new Error(
        `Erro no upload para GCS: ${uploadResponse.status} ${uploadResponse.statusText}`
      );
    }
    console.log("✅ Upload para GCS concluído com sucesso");

    // 4. Tornar arquivo público via API da plataforma
    try {
      const makePublicRequest: IMakeObjectPublicRequest = {
        filePath: publicUrl, // Usar URL completa como na plataforma antiga
      };

      console.log("🔍 Debug - makePublicRequest:", makePublicRequest);

      await postStorageMakeObjectPublic(token, makePublicRequest);
      console.log("✅ make-object-public executado com sucesso");
    } catch (makePublicError) {
      console.error(
        "❌ Erro detalhado no make-object-public:",
        makePublicError
      );
      // Continua mesmo se falhar, pois o upload já foi feito
    }

    return {
      publicUrl,
      success: true,
    };
  } catch (error) {
    console.error("Erro no upload da foto:", error);
    return {
      publicUrl: "",
      success: false,
      error:
        error instanceof Error ? error.message : "Erro desconhecido no upload",
    };
  }
};
