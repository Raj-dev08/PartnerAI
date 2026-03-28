import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useAiBuilderStore } from "../store/useAi";
import { ArrowBigLeft, X } from "lucide-react";

type Errors = Record<string, string>;

export default function UpdateAiPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { isAddingExperience , updatingModel, getAiModelByID, updateAiModel, loading , createInterest , createPastExperience} =
    useAiBuilderStore();

  const [form, setForm] = useState<any>(null);
  const [errors, setErrors] = useState<Errors>({});

  const [showInterest, setShowInterest] = useState(false);
  const [showExperience, setShowExperience] = useState(false);

  const [showExistingExperiences, setShowExistingExperiences] = useState(false);

  const [showExistingInterests, setShowExistingInterests] = useState(false);

  const [interestForm, setInterestForm] = useState({
    interest: "",
    description: "",
    reasonForInterest: "",
    ageWhileInterest: "",
    acheivements: "",
  });

  const [experienceForm, setExperienceForm] = useState({
    event: "",
    description: "",
    ageDuringEvent: "",
  });

  useEffect(() => {
    if (id) getAiModelByID(id);
  }, [id]);

  useEffect(() => {
    if (updatingModel) {
      setForm({
        description: updatingModel.description || "",
        occupation: updatingModel.occupation || "",
        occupationWeightage:
          updatingModel.occupationWeightage || "",
        academicBackground:
          updatingModel.academicBackground || "",
        academicBackgroundWeightage:
          updatingModel.academicBackgroundWeightage || "",
      });
    }
  }, [updatingModel]);

  if (!form) return <div className="text-white p-10">Loading...</div>;

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((p: any) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    const newErrors: Errors = {};

    if ( !form.description.trim()){
        newErrors.description = "Description is Required";
    }
    if ( !form.occupation.trim()){
        newErrors.occupation = "Occupation is Required";
    }
    if ( !form.academicBackground.trim()){
        newErrors.academicBackground = "Academic background is Required";
    }

    if (
      form.occupationWeightage &&
      (isNaN(Number(form.occupationWeightage)) ||
        Number(form.occupationWeightage) < 0 ||
        Number(form.occupationWeightage) > 10)
    ) {
      newErrors.occupationWeightage = "Must be between 0-10";
    }

    if (
      form.academicBackgroundWeightage &&
      (isNaN(Number(form.academicBackgroundWeightage)) ||
        Number(form.academicBackgroundWeightage) < 0 ||
        Number(form.academicBackgroundWeightage) > 10)
    ) {
      newErrors.academicBackgroundWeightage = "Must be between 0-10";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateInterest = () => {
    const newErrors: Errors = {};

    if (!interestForm.interest.trim()) {
        newErrors.interest = "Required";
    } else if (interestForm.interest.length > 40) {
        newErrors.interest = "Max 40 chars";
    }

    if (!interestForm.description.trim()) {
        newErrors.interestDescription = "Required";
    } else if (interestForm.description.length > 100) {
        newErrors.interestDescription = "Max 100 chars";
    }

    if (!interestForm.reasonForInterest.trim()) {
        newErrors.reasonForInterest = "Required";
    } else if (interestForm.reasonForInterest.length > 300) {
        newErrors.reasonForInterest = "Max 300 chars";
    }

    const age = Number(interestForm.ageWhileInterest);
    if (!age || age < 1 || age > 200) {
        newErrors.ageWhileInterest = "1 - 200 only";
    }

    if (interestForm.acheivements) {
        const arr = interestForm.acheivements
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

        console.log(arr)

        if (arr.length > 5) {
            newErrors.acheivements = "Max 5 achievements";
        }

        for (const a of arr) {
            if (a.length > 40) {
                newErrors.acheivements = "Each must be < 40 chars";
            }
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateExperience = () => {
    const newErrors: Errors = {};

    if (!experienceForm.event.trim()) {
    newErrors.event = "Required";
    } else if (experienceForm.event.length > 40) {
    newErrors.event = "Max 40 chars";
    }

    if (!experienceForm.description.trim()) {
    newErrors.experienceDescription = "Required";
    } else if (experienceForm.description.length > 100) {
    newErrors.experienceDescription = "Max 100 chars";
    }

    const age = Number(experienceForm.ageDuringEvent);
    if (!age || age < 1 || age > 200) {
    newErrors.ageDuringEvent = "1 - 200 only";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!id) return;
    if (!validate()) return;

    const payload: any = {};

    if (form.description) payload.description = form.description;
    if (form.occupation) payload.occupation = form.occupation;

    const occWeight = Number(form.occupationWeightage);
    if (!isNaN(occWeight) && occWeight > 0 && occWeight <= 10) {
      payload.occupationWeightage = occWeight;
    }

    if (form.academicBackground)
      payload.academicBackground = form.academicBackground;

    const acadWeight = Number(form.academicBackgroundWeightage);
    if (!isNaN(acadWeight) && acadWeight > 0 && acadWeight <= 10) {
      payload.academicBackgroundWeightage = acadWeight;
    }

    await updateAiModel(id, payload);
  };

  const handleAddInterest = async () => {
    if (!id) return;
    if (!validateInterest()) return;

    const achievementsArray = interestForm.acheivements
    ? interestForm.acheivements
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
    : [];

    await createInterest({
      aiId: id,
      interest: interestForm.interest,
      description: interestForm.description,
      reasonForInterest: interestForm.reasonForInterest,
      ageWhileInterest: Number(interestForm.ageWhileInterest),
      acheivements: achievementsArray,
    });

    setShowInterest(false);
  };

  const handleAddExperience = async () => {
    if (!id) return;

    if (!validateExperience()) return;

    await createPastExperience({
      aiId: id,
      event: experienceForm.event,
      description: experienceForm.description,
      ageDuringEvent: Number(experienceForm.ageDuringEvent),
    });

    setShowExperience(false);
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-sm focus:outline-none focus:ring-1 focus:ring-white/30";

  const labelClass = "text-xs text-neutral-400 mb-1 flex justify-between";

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-xl mx-auto space-y-6">

        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-neutral-400 hover:text-white flex items-center gap-2"
          >
            <ArrowBigLeft/> Back
          </button>

          <h1 className="text-lg font-semibold">
            Update AI Model
          </h1>

          <div className="w-10" />
        </div>

        {/* DESCRIPTION */}
        <div>
          <div className={labelClass}>
            <span>Description</span>
          </div>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className={inputClass}
            placeholder="Describe your AI..."
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">
              {errors.description}
            </p>
          )}
        </div>

        {/* OCCUPATION */}
        <div>
          <div className={labelClass}>
            <span>Occupation</span>
          </div>
          <input
            name="occupation"
            value={form.occupation}
            onChange={handleChange}
            className={inputClass}
          />
          {errors.occupation && (
            <p className="text-red-500 text-xs mt-1">
              {errors.occupation}
            </p>
          )}
        </div>

        {/* OCCUPATION WEIGHT */}
        <div>
          <div className={labelClass}>
            <span>Occupation Weight</span>
            <span>0 - 10</span>
          </div>
          <input
            name="occupationWeightage"
            value={form.occupationWeightage}
            onChange={handleChange}
            className={inputClass}
          />
          {errors.occupationWeightage && (
            <p className="text-red-500 text-xs mt-1">
              {errors.occupationWeightage}
            </p>
          )}
        </div>

        {/* ACADEMIC */}
        <div>
          <div className={labelClass}>
            <span>Academic Background</span>
          </div>
          <input
            name="academicBackground"
            value={form.academicBackground}
            onChange={handleChange}
            className={inputClass}
          />
          {errors.academicBackground && (
            <p className="text-red-500 text-xs mt-1">
              {errors.academicBackground}
            </p>
          )}
        </div>

        {/* ACADEMIC WEIGHT */}
        <div>
          <div className={labelClass}>
            <span>Academic Weight</span>
            <span>0 - 10</span>
          </div>
          <input
            name="academicBackgroundWeightage"
            value={form.academicBackgroundWeightage}
            onChange={handleChange}
            className={inputClass}
          />
          {errors.academicBackgroundWeightage && (
            <p className="text-red-500 text-xs mt-1">
              {errors.academicBackgroundWeightage}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1 space-y-3">
            <button
              onClick={() => setShowExperience(true)}
                className="w-full py-2 rounded-lg border border-neutral-700 text-sm hover:bg-neutral-900">
                + Add Memory
              </button>
              <button
                onClick={() => setShowExistingExperiences((prev) => !prev)}
                className="w-full py-2 rounded-lg border border-neutral-700 text-sm hover:bg-neutral-900"
              >
                {showExistingExperiences ? "Hide Memories" : "Show Memories"}
              </button>
          </div>
          
          
        <div className="flex-1 space-y-3">
          <button 
            onClick={() => setShowInterest(true)}
            className="w-full py-2 rounded-lg border border-neutral-700 text-sm hover:bg-neutral-900">
              + Add Interest
            </button>

            <button
              onClick={() => setShowExistingInterests((prev) => !prev)}
              className="w-full py-2 rounded-lg border border-neutral-700 text-sm hover:bg-neutral-900"
            >
              {showExistingExperiences ? "Hide Interests" : "Show Interests"}
            </button>
        </div>
          
        </div>

        {/* UPDATE BUTTON */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-white text-black rounded-lg text-sm font-medium"
        >
          {loading ? "Updating..." : "Update AI"}
        </motion.button>


        {showInterest && (
          <Modal onClose={() => setShowInterest(false)}>
            <h2 className="text-lg font-semibold mb-4">Add Interest</h2>

            <input
              placeholder="Interest"
              className={inputClass}
              onChange={(e) =>
                setInterestForm((p) => ({ ...p, interest: e.target.value }))
              }
            />

            {errors.interest && (
                <p className="text-red-500 text-xs">{errors.interest}</p>
            )}

            <input
              placeholder="Description"
              className={inputClass}
              onChange={(e) =>
                setInterestForm((p) => ({
                  ...p,
                  description: e.target.value,
                }))
              }
            />

            {errors.interestDescription && (
                <p className="text-red-500 text-xs">{errors.interestDescription}</p>
            )}

            <input
              placeholder="Reason"
              className={inputClass}
              onChange={(e) =>
                setInterestForm((p) => ({
                  ...p,
                  reasonForInterest: e.target.value,
                }))
              }
            />

            {errors.reasonForInterest && (
                <p className="text-red-500 text-xs">{errors.reasonForInterest}</p>
            )}

            <input
              placeholder="Age"
              className={inputClass}
              onChange={(e) =>
                setInterestForm((p) => ({
                  ...p,
                  ageWhileInterest: e.target.value,
                }))
              }
            />

            {errors.ageWhileInterest && (
                <p className="text-red-500 text-xs">{errors.ageWhileInterest}</p>
            )}

            <input
              placeholder="Achievements (comma separated)"
              className={inputClass}
              onChange={(e) =>
                setInterestForm((p) => ({
                  ...p,
                  acheivements: e.target.value,
                }))
              }
            />

            {errors.acheivements && (
                <p className="text-red-500 text-xs">{errors.acheivements}</p>
            )}

            <button
              onClick={handleAddInterest}
              disabled={isAddingExperience}
              className="w-full mt-4 py-2 bg-white text-black rounded-lg"
            >
              {isAddingExperience? "Saving..." : "Save"}
            </button>
          </Modal>
        )}

        {showExperience && (
          <Modal onClose={() => setShowExperience(false)}>
            <h2 className="text-lg font-semibold mb-4">Add Memory</h2>

            <input
              placeholder="Event"
              className={inputClass}
              onChange={(e) =>
                setExperienceForm((p) => ({ ...p, event: e.target.value }))
              }
            />

            {errors.event && (
                <p className="text-red-500 text-xs">{errors.event}</p>
            )}


            <input
              placeholder="Description"
              className={inputClass}
              onChange={(e) =>
                setExperienceForm((p) => ({
                  ...p,
                  description: e.target.value,
                }))
              }
            />
            {errors.experienceDescription && (
                <p className="text-red-500 text-xs">{errors.experienceDescription}</p>
            )}


            <input
              placeholder="Age"
              className={inputClass}
              onChange={(e) =>
                setExperienceForm((p) => ({
                  ...p,
                  ageDuringEvent: e.target.value,
                }))
              }
            />
            

            {errors.ageDuringEvent && (
                <p className="text-red-500 text-xs">{errors.ageDuringEvent}</p>
            )}


            <button
              onClick={handleAddExperience}
              disabled={isAddingExperience}
              className="w-full mt-4 py-2 bg-white text-black rounded-lg"
            >
              {isAddingExperience ? "Saving..." : "Save"}
            </button>
          </Modal>
        )}

        {showExistingExperiences && (
        <div className="space-y-3 font-body">
          Memories:
          {updatingModel?.pastExperiences?.length > 0 ? (
            updatingModel?.pastExperiences.map((exp: any, i: number) => (
              <div
                key={i}
                className="p-3 mt-2 rounded-lg border border-neutral-800 bg-neutral-900"
              >
                <p className="text-sm font-medium">{exp.event}</p>
                <p className="text-xs text-neutral-400">
                  {exp.description}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Age: {exp.ageDuringEvent}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-500">
              No memories added yet
            </p>
          )}
        </div>
      )}

      {showExistingInterests && (
        <div className="space-y-3 font-body">
          Interests:
          {updatingModel?.interests?.length > 0 ? (
            updatingModel?.interests.map((exp: any, i: number) => (
              <div
                key={i}
                className="p-3 mt-2 rounded-lg border border-neutral-800 bg-neutral-900"
              >
                <p className="text-sm font-medium">{exp.interest}</p>
                <p className="text-xs text-neutral-400">
                  {exp.description}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Age: {exp.ageWhileInterest}
                </p>

                <p className="text-[10px] text-neutral-500 mt-1">
                  Reason: {exp.reasonForInterest}
                </p>

                { exp?.acheivments?.length > 0  &&<p className="text-[10px] text-neutral-500 mt-1">
                  Achievents: {exp.acheivements?.join(", ")}
                </p>
                } 
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-500">
              No memories added yet
            </p>
          )}
        </div>
      )}

      </div>
    </div>
  );
}

function Modal({ children, onClose }: any) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-neutral-900 p-6 rounded-xl w-full max-w-md relative space-y-3"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-400"
        >
          <X size={18} />
        </button>

        {children}
      </motion.div>
    </motion.div>
  );
}