import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({ 
        cloud_name: process.env.CLOUDYNARY_CLOUD_NAME, 
        api_key: process.env.CLOUDYNARY_API_KEY, 
        api_secret: CLOUDYNARY_API_SECRECT // Click 'View API Keys' above to copy your API secret
    });

const uploadOnCloudynary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(
            localFilePath, {
                resource_type : "auto"
            }
        )
        console.log("file up load on cloudynary. File src :" + response.url);
        // khi tập tin đã tải lên 
        fs.unlinkSync(localFilePath)
        return response
        
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}

export {uploadOnCloudynary}