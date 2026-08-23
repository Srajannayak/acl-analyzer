import { useState } from "react";
import { UploadCloud, Video, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import UploadPreview from "./UploadPreview";

import "../../styles/upload.css";

export default function UploadBox(){

    const navigate = useNavigate();

    const [video,setVideo] = useState(null);

    function handleVideo(e){

        const file = e.target.files[0];

        if(!file) return;

        setVideo(file);

    }

    function removeVideo(){

        setVideo(null);

    }

    function analyzeVideo(){

        if(!video){

            alert("Please upload a video first.");

            return;

        }

        navigate("/processing");

    }

    return(

        <section className="upload-page">

            <div className="upload-header">

                <span>UPLOAD VIDEO</span>

                <h1>

                    Athlete Movement Analysis

                </h1>

                <p>

                    Upload an athlete's landing or movement video to begin AI-powered ACL injury analysis.

                </p>

            </div>

            {!video ?

            <label className="upload-box">

                <UploadCloud size={70}/>

                <h2>

                    Drag & Drop Video

                </h2>

                <p>

                    MP4 • MOV • AVI

                </p>

                <button>

                    Browse Video

                </button>

                <input

                type="file"

                accept="video/*"

                hidden

                onChange={handleVideo}

                />

            </label>

            :

            <UploadPreview

            file={video}

            removeVideo={removeVideo}

            analyzeVideo={analyzeVideo}

            />

            }

        </section>

    )

}