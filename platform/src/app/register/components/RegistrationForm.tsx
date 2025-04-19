'use client';

import React, { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createRegistration, RegistrationState } from '../actions'; // Server Action

// Define structure for form data state based on spec v1.1
type FormData = {
  // Basic Info
  full_name?: string;
  email?: string; // Added email
  university?: string;
  program?: string;
  year_of_study?: number;

  // Date Flexibility
  can_attend_may_3_4?: 'yes' | 'no' | 'maybe';
  may_3_4_comment?: string;

  // Philosophical Background
  prior_courses?: string[];
  discussion_confidence?: number;
  writing_confidence?: number;
  familiarity_analytic?: number;
  familiarity_continental?: number;
  familiarity_other?: number;
  philosophical_traditions?: string[];
  philosophical_interests?: string[];
  areas_of_interest?: string;

  // Theme and Workshop Preferences
  theme_rankings?: Array<{rank: number, theme_id: string}>;
  theme_suggestion?: string;
  workshop_rankings?: Array<{rank: number, workshop_id: string}>;

  // Team Formation Preferences
  preferred_working_style?: 'structured' | 'exploratory' | 'balanced';
  teammate_similarity?: number;
  skill_writing?: number;
  skill_speaking?: number;
  skill_research?: number;
  skill_synthesis?: number;
  skill_critique?: number;
  mentorship_preference?: 'mentor' | 'mentee' | 'no_preference';
  mentorship_areas?: string;
  preferred_teammates?: string;
  complementary_perspectives?: string;

  // Technical Experience & Accessibility
  familiarity_tech_concepts?: number;
  prior_hackathon_experience?: boolean;
  prior_hackathon_details?: string;
  dietary_restrictions?: string;
  accessibility_needs?: string;
  additional_notes?: string;
  how_heard?: 'email' | 'professor' | 'friend' | 'department' | 'social_media' | 'other';
  how_heard_other?: string;
};

const initialState: RegistrationState = { // For useFormState
  message: null,
  errors: {},
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? 'Submitting...' : 'Submit Registration'}</button>;
}

// Placeholder data for themes and workshops (replace with actual data fetching if needed)
const THEMES = [
    { id: 'minds_machines', title: 'Minds and Machines: Consciousness Beyond the Human' },
    { id: 'digital_commons', title: 'Digital Commons: Rethinking Property in Information Space' },
    { id: 'algorithmic_justice', title: 'Algorithmic Justice: Bias, Fairness, and Accountability in AI' },
    { id: 'virtual_reality', title: 'Virtual Reality and Real Virtues: Ethics in Simulated Worlds' },
    { id: 'technological_determinism', title: 'Technological Determinism: Do Our Tools Control Us?' },
    { id: 'posthumanism', title: 'Posthumanism: Technology and the Future of Human Nature' },
    { id: 'surveillance_privacy', title: 'Surveillance and Privacy in the Digital Age' },
    { id: 'environmental_tech', title: 'Environmental Ethics and Technological Solutions' },
];

const WORKSHOPS = [
    { id: 'language_models', title: 'Language Models as Philosophical Objects' },
    { id: 'generative_ai', title: 'Generative AI Art: Creativity, Authorship, and Aesthetics' },
    { id: 'ethics_autonomous_systems', title: 'Ethics of Autonomous Systems' },
    { id: 'philosophy_social_media', title: 'Philosophy of Social Media: Identity and Community Online' },
    { id: 'digital_epistemology', title: 'Digital Epistemology: Knowledge in the Age of Information' },
    { id: 'ai_existential_risk', title: 'AI Existential Risk: Philosophical Perspectives' },
    { id: 'tech_critique_methods', title: 'Methods for Critiquing Technology' },
    { id: 'applied_tech_ethics', title: 'Applied Tech Ethics Case Studies' },
];

const PHILOSOPHICAL_TRADITIONS = ['analytic', 'continental', 'ancient', 'medieval', 'modern', 'non_western', 'new_to_philosophy', 'other'];
const PHILOSOPHICAL_INTERESTS = ['metaphysics', 'epistemology', 'ethics', 'political_philosophy', 'philosophy_of_mind', 'philosophy_of_language', 'philosophy_of_technology', 'philosophy_of_science', 'aesthetics', 'phenomenology', 'logic', 'existentialism', 'post_structuralism', 'critical_theory', 'feminist_philosophy', 'environmental_philosophy', 'other'];
const PRIOR_COURSES_OPTIONS = ['intro_philosophy', 'ethics', 'logic', 'metaphysics', 'epistemology', 'ancient_philosophy', 'modern_philosophy', 'continental_philosophy', 'analytic_philosophy', 'philosophy_of_mind', 'philosophy_of_language', 'philosophy_of_science', 'political_philosophy', 'other'];
const HOW_HEARD_OPTIONS = ['email', 'professor', 'friend', 'department', 'social_media', 'other'];


export function RegistrationForm({ userEmail }: { userEmail?: string | null }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>({ email: userEmail || undefined }); // Store data across steps, prefill email
  const [state, formAction] = useFormState(createRegistration, initialState);

  // Update email in state if userEmail prop changes (e.g., after login)
  useEffect(() => {
    if (userEmail && formData.email !== userEmail) {
      setFormData((prev: Partial<FormData>) => ({ ...prev, email: userEmail }));
    }
  }, [userEmail, formData.email]);


  const totalSteps = 5; // Updated based on spec

  const handleNext = () => {
    // Optional: Add client-side validation for the current step's fields here
    // if (!validateStep(currentStep, formData)) return;
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
        // Handle multi-select checkbox for array fields
        const checkbox = e.target as HTMLInputElement;
        const currentValues = formData[name as keyof typeof formData] as string[] || [];
        if (checkbox.checked) {
            setFormData((prev: Partial<FormData>) => ({ ...prev, [name]: [...currentValues, value] }));
        } else {
            setFormData((prev: Partial<FormData>) => ({ ...prev, [name]: currentValues.filter((val: string) => val !== value) }));
        }
    } else if (type === 'radio') {
         // Handle radio buttons
         if (name === 'prior_hackathon_experience') {
             setFormData((prev: Partial<FormData>) => ({ ...prev, [name]: value === 'true' }));
         } else {
             setFormData((prev: Partial<FormData>) => ({ ...prev, [name]: value as any })); // Cast value for enum types
         }
    } else if (type === 'number' || name.includes('confidence') || name.includes('familiarity') || name.includes('skill') || name === 'year_of_study' || name === 'teammate_similarity') {
        // Handle numeric inputs including scales and year_of_study
        const numValue = parseInt(value, 10);
        setFormData((prev: Partial<FormData>) => ({ ...prev, [name]: isNaN(numValue) ? undefined : numValue }));
    } else {
      setFormData((prev: Partial<FormData>) => ({ ...prev, [name]: value }));
    }
  };

  // Special handler for theme and workshop rankings (using simplified select for now)
  const handleRankingChange = (type: 'theme' | 'workshop', id: string, rankStr: string) => {
    const rank = parseInt(rankStr, 10);
    if (isNaN(rank)) return; // Ignore if rank is not a number

    const rankingField = `${type}_rankings` as const;
    const currentRankings = formData[rankingField] || [];
    const idField = `${type}_id` as const;

    // Remove existing ranking for this item if it exists
    const filteredRankings = currentRankings.filter((item: any) => item[idField] !== id);

    // Add new ranking
    const updatedRankings = [...filteredRankings, { rank, [idField]: id }];

    setFormData((prev: Partial<FormData>) => ({ ...prev, [rankingField]: updatedRankings }));
  };


  // Render different form sections based on currentStep
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Basic Info & Date Flexibility
        return (
          <div>
            <h2>Step 1: Basic Information</h2>
            {/* Email (Prefilled & Readonly) */}
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={formData.email || ''} readOnly required />
            {state.errors?.email && <p className="text-red-500">{state.errors.email[0]}</p>}

            <label htmlFor="full_name">Full Name</label>
            <input type="text" id="full_name" name="full_name" onChange={handleChange} value={formData.full_name || ''} required />
            {state.errors?.full_name && <p className="text-red-500">{state.errors.full_name[0]}</p>}

            <label htmlFor="university">University/Institution</label>
            <input type="text" id="university" name="university" onChange={handleChange} value={formData.university || ''} required />
            {state.errors?.university && <p className="text-red-500">{state.errors.university[0]}</p>}

            <label htmlFor="program">Program/Major</label>
            <input type="text" id="program" name="program" onChange={handleChange} value={formData.program || ''} required />
            {state.errors?.program && <p className="text-red-500">{state.errors.program[0]}</p>}

            <label htmlFor="year_of_study">Year of Study</label>
            <select id="year_of_study" name="year_of_study" onChange={handleChange} value={formData.year_of_study || ''} required>
              <option value="">Select Year...</option>
              {[1, 2, 3, 4, 5].map(year => <option key={year} value={year}>{year === 5 ? 'Graduate Student' : `Year ${year}`}</option>)}
            </select>
            {state.errors?.year_of_study && <p className="text-red-500">{state.errors.year_of_study[0]}</p>}

            <h3>Date Flexibility</h3>
            <label>Would you be able to participate if the event were delayed to May 3-4, 2025?</label>
            <select name="can_attend_may_3_4" onChange={handleChange} value={formData.can_attend_may_3_4 || ''} required>
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="maybe">Maybe</option>
            </select>
            {state.errors?.can_attend_may_3_4 && <p className="text-red-500">{state.errors.can_attend_may_3_4[0]}</p>}

            {formData.can_attend_may_3_4 === 'maybe' && (
              <>
                <label htmlFor="may_3_4_comment">Please explain:</label>
                <textarea id="may_3_4_comment" name="may_3_4_comment" onChange={handleChange} value={formData.may_3_4_comment || ''} />
              </>
            )}
          </div>
        );

      case 2: // Philosophical Background
        return (
          <div>
            <h2>Step 2: Philosophical Background</h2>

            <label>Prior philosophy courses taken (select all that apply):</label>
            <div className="checkbox-group">
              {PRIOR_COURSES_OPTIONS.map(course => (
                <label key={course}><input type="checkbox" name="prior_courses" value={course} onChange={handleChange} checked={formData.prior_courses?.includes(course)} /> {course.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
              ))}
            </div>

            <label htmlFor="discussion_confidence">Confidence in philosophical discussion (1-10):</label>
            <div className="scale-description">
              <span className="scale-min">1 = I have achieved Socratic wisdom (knowing I know nothing)</span>
              <span className="scale-max">10 = I am prepared to argue that this scale itself is metaphysically suspect</span>
            </div>
            <input type="range" id="discussion_confidence" name="discussion_confidence" min="1" max="10" onChange={handleChange} value={formData.discussion_confidence || 5} required />
            <output>{formData.discussion_confidence || 5}</output>
            {state.errors?.discussion_confidence && <p className="text-red-500">{state.errors.discussion_confidence[0]}</p>}


            <label htmlFor="writing_confidence">Confidence in philosophical writing (1-10):</label>
             <div className="scale-description">
               <span className="scale-min">1 = My prose style is best described as &apos;early Wittgenstein&apos;</span>
               <span className="scale-max">10 = My footnotes have footnotes</span>
             </div>
            <input type="range" id="writing_confidence" name="writing_confidence" min="1" max="10" onChange={handleChange} value={formData.writing_confidence || 5} required />
            <output>{formData.writing_confidence || 5}</output>
            {state.errors?.writing_confidence && <p className="text-red-500">{state.errors.writing_confidence[0]}</p>}


            <label htmlFor="familiarity_analytic">Familiarity with Analytic Tradition (1-5):</label>
            <input type="range" id="familiarity_analytic" name="familiarity_analytic" min="1" max="5" onChange={handleChange} value={formData.familiarity_analytic || 3} required />
            <output>{formData.familiarity_analytic || 3}</output>
            {state.errors?.familiarity_analytic && <p className="text-red-500">{state.errors.familiarity_analytic[0]}</p>}


            <label htmlFor="familiarity_continental">Familiarity with Continental Tradition (1-5):</label>
            <input type="range" id="familiarity_continental" name="familiarity_continental" min="1" max="5" onChange={handleChange} value={formData.familiarity_continental || 3} required />
            <output>{formData.familiarity_continental || 3}</output>
            {state.errors?.familiarity_continental && <p className="text-red-500">{state.errors.familiarity_continental[0]}</p>}


            <label htmlFor="familiarity_other">Familiarity with Other Traditions (1-5):</label>
            <input type="range" id="familiarity_other" name="familiarity_other" min="1" max="5" onChange={handleChange} value={formData.familiarity_other || 3} required />
            <output>{formData.familiarity_other || 3}</output>
            {state.errors?.familiarity_other && <p className="text-red-500">{state.errors.familiarity_other[0]}</p>}


            <label>Philosophical traditions you&apos;re familiar with (select all that apply):</label>
            <div className="checkbox-group">
               {PHILOSOPHICAL_TRADITIONS.map(trad => (
                 <label key={trad}><input type="checkbox" name="philosophical_traditions" value={trad} onChange={handleChange} checked={formData.philosophical_traditions?.includes(trad)} /> {trad.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
               ))}
            </div>
            {state.errors?.philosophical_traditions && <p className="text-red-500">{state.errors.philosophical_traditions[0]}</p>}


            <label>Areas of philosophical interest (select all that apply):</label>
            <div className="checkbox-group">
               {PHILOSOPHICAL_INTERESTS.map(interest => (
                 <label key={interest}><input type="checkbox" name="philosophical_interests" value={interest} onChange={handleChange} checked={formData.philosophical_interests?.includes(interest)} /> {interest.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
               ))}
            </div>
             {state.errors?.philosophical_interests && <p className="text-red-500">{state.errors.philosophical_interests[0]}</p>}


            <label htmlFor="areas_of_interest">Other areas of philosophical interest:</label>
            <textarea id="areas_of_interest" name="areas_of_interest" onChange={handleChange} value={formData.areas_of_interest || ''} />
          </div>
        );

      case 3: // Theme & Workshop Preferences
        return (
          <div>
            <h2>Step 3: Theme & Workshop Preferences</h2>

            <h3>Theme Rankings</h3>
            <p>Please rank your preferred themes (1 = most preferred):</p>
            <div className="theme-ranking">
              {THEMES.map(theme => (
                <div key={theme.id} className="theme-item">
                  <span>{theme.title}</span>
                  <select
                    onChange={(e) => handleRankingChange('theme', theme.id, e.target.value)}
                    value={formData.theme_rankings?.find((t: any) => t.theme_id === theme.id)?.rank || ''}
                  >
                    <option value="">--</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {state.errors?.theme_rankings && <p className="text-red-500">{state.errors.theme_rankings[0]}</p>}

            <label htmlFor="theme_suggestion">Suggest an alternative theme:</label>
            <textarea id="theme_suggestion" name="theme_suggestion" onChange={handleChange} value={formData.theme_suggestion || ''} />

            <h3>Workshop Rankings</h3>
            <p>Please rank at least 3 workshops you&apos;re interested in (1 = most preferred):</p>
            <div className="workshop-ranking">
              {WORKSHOPS.map(workshop => (
                <div key={workshop.id} className="workshop-item">
                  <span>{workshop.title}</span>
                  <select
                    onChange={(e) => handleRankingChange('workshop', workshop.id, e.target.value)}
                    value={formData.workshop_rankings?.find((w: any) => w.workshop_id === workshop.id)?.rank || ''}
                  >
                    <option value="">--</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {state.errors?.workshop_rankings && <p className="text-red-500">{state.errors.workshop_rankings[0]}</p>}
          </div>
        );

      case 4: // Team Formation Preferences
        return (
          <div>
            <h2>Step 4: Team Formation Preferences</h2>

            <label>Preferred working style:</label>
            <select name="preferred_working_style" onChange={handleChange} value={formData.preferred_working_style || ''} required>
              <option value="">Select...</option>
              <option value="structured">Structured (Clear plan, defined roles)</option>
              <option value="exploratory">Exploratory (Flexible, evolving approach)</option>
              <option value="balanced">Balanced (Mix of structure and exploration)</option>
            </select>
            {state.errors?.preferred_working_style && <p className="text-red-500">{state.errors.preferred_working_style[0]}</p>}

            <label htmlFor="teammate_similarity">Teammate similarity preference (1-10):</label>
            <div className="scale-description">
              <span className="scale-min">1 = Prefer teammates with very different interests</span>
              <span className="scale-max">10 = Prefer teammates with very similar interests</span>
            </div>
            <input type="range" id="teammate_similarity" name="teammate_similarity" min="1" max="10" onChange={handleChange} value={formData.teammate_similarity || 5} required />
            <output>{formData.teammate_similarity || 5}</output>
            {state.errors?.teammate_similarity && <p className="text-red-500">{state.errors.teammate_similarity[0]}</p>}

            <h3>Self-Assessment of Skills (1-5)</h3>
            <label htmlFor="skill_writing">Writing:</label>
            <input type="range" id="skill_writing" name="skill_writing" min="1" max="5" onChange={handleChange} value={formData.skill_writing || 3} required />
            <output>{formData.skill_writing || 3}</output>
            {state.errors?.skill_writing && <p className="text-red-500">{state.errors.skill_writing[0]}</p>}

            <label htmlFor="skill_speaking">Speaking:</label>
            <input type="range" id="skill_speaking" name="skill_speaking" min="1" max="5" onChange={handleChange} value={formData.skill_speaking || 3} required />
            <output>{formData.skill_speaking || 3}</output>
            {state.errors?.skill_speaking && <p className="text-red-500">{state.errors.skill_speaking[0]}</p>}

            <label htmlFor="skill_research">Research:</label>
            <input type="range" id="skill_research" name="skill_research" min="1" max="5" onChange={handleChange} value={formData.skill_research || 3} required />
            <output>{formData.skill_research || 3}</output>
            {state.errors?.skill_research && <p className="text-red-500">{state.errors.skill_research[0]}</p>}

            <label htmlFor="skill_synthesis">Synthesis:</label>
            <input type="range" id="skill_synthesis" name="skill_synthesis" min="1" max="5" onChange={handleChange} value={formData.skill_synthesis || 3} required />
            <output>{formData.skill_synthesis || 3}</output>
            {state.errors?.skill_synthesis && <p className="text-red-500">{state.errors.skill_synthesis[0]}</p>}

            <label htmlFor="skill_critique">Critique:</label>
            <input type="range" id="skill_critique" name="skill_critique" min="1" max="5" onChange={handleChange} value={formData.skill_critique || 3} required />
            <output>{formData.skill_critique || 3}</output>
            {state.errors?.skill_critique && <p className="text-red-500">{state.errors.skill_critique[0]}</p>}

            <h3>Mentorship Program (Optional)</h3>
            <p>Would you be interested in our optional mentorship program?</p>
            <select name="mentorship_preference" onChange={handleChange} value={formData.mentorship_preference || ''}>
              <option value="">Not interested</option>
              <option value="mentor">I&apos;d like to be a mentor</option>
              <option value="mentee">I&apos;d like to be a mentee</option>
              <option value="no_preference">Interested, no specific preference</option>
            </select>

            {formData.mentorship_preference === 'mentor' && (
              <>
                <label htmlFor="mentorship_areas">Areas you&apos;re comfortable mentoring in:</label>
                <textarea id="mentorship_areas" name="mentorship_areas" onChange={handleChange} value={formData.mentorship_areas || ''} />
              </>
            )}

            <label htmlFor="preferred_teammates">Is there anyone you&apos;d particularly like to work with?</label>
            <textarea id="preferred_teammates" name="preferred_teammates" onChange={handleChange} value={formData.preferred_teammates || ''} />

            <label htmlFor="complementary_perspectives">Are there any perspectives you feel would complement yours on a team?</label>
            <textarea id="complementary_perspectives" name="complementary_perspectives" onChange={handleChange} value={formData.complementary_perspectives || ''} />
          </div>
        );

      case 5: // Technical Experience & Accessibility
        return (
          <div>
            <h2>Step 5: Technical Experience & Accessibility</h2>

            <label htmlFor="familiarity_tech_concepts">Familiarity with technology concepts (1-5):</label>
            <input type="range" id="familiarity_tech_concepts" name="familiarity_tech_concepts" min="1" max="5" onChange={handleChange} value={formData.familiarity_tech_concepts || 3} required />
            <output>{formData.familiarity_tech_concepts || 3}</output>
            {state.errors?.familiarity_tech_concepts && <p className="text-red-500">{state.errors.familiarity_tech_concepts[0]}</p>}

            <label>Prior hackathon experience:</label>
            <div className="radio-group">
              <label>
                <input type="radio" name="prior_hackathon_experience" value="true" onChange={handleChange} checked={formData.prior_hackathon_experience === true} required /> Yes
              </label>
              <label>
                <input type="radio" name="prior_hackathon_experience" value="false" onChange={handleChange} checked={formData.prior_hackathon_experience === false} required /> No
              </label>
            </div>
            {state.errors?.prior_hackathon_experience && <p className="text-red-500">{state.errors.prior_hackathon_experience[0]}</p>}


            {formData.prior_hackathon_experience === true && (
              <>
                <label htmlFor="prior_hackathon_details">Please describe your hackathon experience:</label>
                <textarea id="prior_hackathon_details" name="prior_hackathon_details" onChange={handleChange} value={formData.prior_hackathon_details || ''} />
              </>
            )}

            <label htmlFor="dietary_restrictions">Dietary restrictions or preferences:</label>
            <textarea id="dietary_restrictions" name="dietary_restrictions" onChange={handleChange} value={formData.dietary_restrictions || ''} />

            <label htmlFor="accessibility_needs">Do you require any accessibility accommodations?</label>
            <p className="help-text">This information will be kept confidential and used only to ensure your full participation in the event.</p>
            <textarea id="accessibility_needs" name="accessibility_needs" onChange={handleChange} value={formData.accessibility_needs || ''} />

            <label htmlFor="additional_notes">Anything else you&apos;d like us to know?</label>
            <textarea id="additional_notes" name="additional_notes" onChange={handleChange} value={formData.additional_notes || ''} />

            <label>How did you hear about the Philosothon?</label>
            <select name="how_heard" onChange={handleChange} value={formData.how_heard || ''} required>
              <option value="">Select...</option>
              {HOW_HEARD_OPTIONS.map(source => (
                 <option key={source} value={source}>{source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
            {state.errors?.how_heard && <p className="text-red-500">{state.errors.how_heard[0]}</p>}


            {formData.how_heard === 'other' && (
              <>
                <label htmlFor="how_heard_other">Please specify:</label>
                <input type="text" id="how_heard_other" name="how_heard_other" onChange={handleChange} value={formData.how_heard_other || ''} required />
                {state.errors?.how_heard_other && <p className="text-red-500">{state.errors.how_heard_other[0]}</p>}
              </>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <form action={formAction}>
      {/* Display overall form messages */}
      {state.message && !state.success && <p className="text-red-500">{state.message}</p>}

      {/* Progress indicator */}
      <div className="progress-indicator">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className={`progress-step ${currentStep > i ? 'completed' : ''} ${currentStep === i + 1 ? 'active' : ''}`}>
            {i + 1}
          </div>
        ))}
      </div>

      {renderStepContent()}

      {/* Hidden fields to pass all data on final submission */}
      {currentStep === totalSteps && (
        Object.entries(formData).map(([key, value]) => {
          // Skip email if it's already in the form (it should be)
          if (key === 'email') return null;

          if (Array.isArray(value)) {
            // Handle array fields like checkboxes
            return value.map((item, index) => {
              // Ensure only strings are passed to the value attribute
              if (typeof item === 'string') {
                return <input key={`${key}-${index}`} type="hidden" name={key} value={item} />;
              }
              // Skip non-string array items (like ranking objects) here, they are handled below
              return null;
            });
          } else if (typeof value === 'object' && value !== null) {
            // Handle JSON fields like rankings
            return <input key={key} type="hidden" name={key} value={JSON.stringify(value)} />;
          } else if (value !== null && value !== undefined) {
            // Handle simple values (string, number, boolean)
            return <input key={key} type="hidden" name={key} value={String(value)} />;
          }
          return null;
        })
      )}
       {/* Ensure email is always submitted */}
       {currentStep === totalSteps && formData.email && (
           <input type="hidden" name="email" value={formData.email} />
       )}


      {/* Navigation Buttons */}
      <div className="navigation-buttons">
        {currentStep > 1 && (
          <button type="button" onClick={handlePrevious}>Previous</button>
        )}
        {currentStep < totalSteps && (
          <button type="button" onClick={handleNext}>Next</button>
        )}
        {currentStep === totalSteps && (
          <SubmitButton />
        )}
      </div>
    </form>
  );
}