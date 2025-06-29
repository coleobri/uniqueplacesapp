"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const [location, setLocation] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [randomLoading, setRandomLoading] = useState(false);
  const [radius, setRadius] = useState(20); // miles
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submission, setSubmission] = useState({
    name: "",
    address: "",
    description: "",
    latitude: "",
    longitude: "",
    submitterEmail: ""
  });
  const [votedPlaceIds, setVotedPlaceIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("votedPlaceIds") || "[]");
      } catch {
        return [];
      }
    }
    return [];
  });
  const [userVotes, setUserVotes] = useState<Record<string, "up" | "down" | null>>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("userVotes") || "{}") as Record<string, "up" | "down" | null>;
      } catch {
        return {};
      }
    }
    return {};
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("votedPlaceIds", JSON.stringify(votedPlaceIds));
      localStorage.setItem("userVotes", JSON.stringify(userVotes));
    }
  }, [votedPlaceIds, userVotes]);

  function getPlaceId(place: any) {
    return (
      place.id ||
      place.place_id ||
      (place.displayName?.text || "") + "|" + (place.formattedAddress || "")
    );
  }

  async function handleVote(place: any, vote: "up" | "down") {
    const placeId = getPlaceId(place);
    const prevVote = userVotes[placeId];
    // If clicking the same vote, undo it
    if (prevVote === vote) {
      setUserVotes((prev) => ({ ...prev, [placeId]: null }));
      setVotes((prev) => {
        const prevCount = prev[placeId] ?? place._votes ?? 0;
        let newCount = prevCount + (vote === "up" ? -1 : 1);
        return { ...prev, [placeId]: newCount };
      });
      // Send to backend (treat as opposite vote to undo)
      fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: vote === "up" ? "down" : "up", placeId }),
      });
      return;
    }
    // Otherwise, normal voting logic
    setUserVotes((prev) => ({ ...prev, [placeId]: vote }));
    setVotes((prev) => {
      const prevCount = prev[placeId] ?? place._votes ?? 0;
      let newCount = prevCount;
      if (prevVote === "up" && vote === "down") newCount = prevCount - 2;
      else if (prevVote === "down" && vote === "up") newCount = prevCount + 2;
      else if (!prevVote) newCount = prevCount + (vote === "up" ? 1 : -1);
      return { ...prev, [placeId]: newCount };
    });
    fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote, placeId }),
    });
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: location, radiusMiles: radius }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data.places || []);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRandom() {
    setRandomLoading(true);
    setError("");
    setResults([]);
    // List of interesting/random world locations
    const randomLocations = [
      "Reykjavik, Iceland",
      "Kyoto, Japan",
      "Cape Town, South Africa",
      "Cusco, Peru",
      "Tallinn, Estonia",
      "Queenstown, New Zealand",
      "Marrakech, Morocco",
      "Banff, Canada",
      "Tbilisi, Georgia",
      "Valparaíso, Chile",
      "Luang Prabang, Laos",
      "Portland, Oregon",
      "Melbourne, Australia",
      "Lofoten, Norway",
      "Ljubljana, Slovenia",
      "Isle of Skye, Scotland",
      "Cartagena, Colombia",
      "Matera, Italy",
      "Ushuaia, Argentina",
      "Siem Reap, Cambodia",
    ];
    const randomLoc =
      randomLocations[Math.floor(Math.random() * randomLocations.length)];
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: randomLoc }),
      });
      const data = await res.json();
      if (res.ok && data.places && data.places.length > 0) {
        // Pick one random result from the returned places
        const one = data.places[Math.floor(Math.random() * data.places.length)];
        setResults([one]);
      } else {
        setError("No cool places found. Try again!");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setRandomLoading(false);
    }
  }

  async function handleSubmitPlace(e: React.FormEvent) {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitSuccess("");
    setSubmitError("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submission,
          latitude: parseFloat(submission.latitude),
          longitude: parseFloat(submission.longitude)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitSuccess("Thank you! Your submission will be reviewed.");
        setSubmission({ name: "", address: "", description: "", latitude: "", longitude: "", submitterEmail: "" });
      } else {
        setSubmitError(data.error || "Submission failed");
      }
    } catch (err) {
      setSubmitError("Network error");
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-12 flex flex-col items-center gap-10 border-2 border-[#E4D9FF] mt-8 mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#273469] text-center mb-4 tracking-tight flex items-center gap-4">
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="10" r="6" stroke="#30343F" strokeWidth="2" />
            <path d="M12 16v4" stroke="#30343F" strokeWidth="2" strokeLinecap="round" />
            <path d="M8 20h8" stroke="#30343F" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Cool Things To Do Near...
        </h1>
        <form className="flex w-full flex-col gap-4" autoComplete="off" onSubmit={handleSearch}>
          <div className="flex w-full gap-4">
            <input
              type="text"
              placeholder="Enter a city, address, or landmark"
              className="flex-1 px-6 py-5 rounded-xl border-2 border-[#E4D9FF] bg-[#FAFAFF] text-[#30343F] placeholder:text-[#1E2749] focus:outline-none focus:border-[#273469] text-lg shadow-sm"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>
          <div className="flex w-full gap-4 mt-2">
            <button
              type="submit"
              className="flex-1 px-8 py-4 rounded-xl bg-[#273469] text-[#FAFAFF] text-lg font-semibold hover:bg-[#30343F] transition-colors shadow-md"
              disabled={loading || !location.trim()}
            >
              {loading ? "Searching..." : "Search"}
            </button>
            <button
              type="button"
              className="flex-1 px-6 py-4 rounded-xl bg-[#E4D9FF] text-[#273469] text-lg font-semibold hover:bg-[#C1B2FA] transition-colors shadow-md"
              onClick={handleRandom}
              disabled={randomLoading}
              title="Find a random cool thing somewhere in the world"
            >
              {randomLoading ? "Finding..." : "🎲 Random"}
            </button>
          </div>
        </form>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="w-full flex flex-col gap-4">
          {results.length === 0 && !loading && !error && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-[#E4D9FF] bg-[#FAFAFF]">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                <path
                  d="M12 2C7.03 2 3 6.03 3 11c0 5.25 7.5 11 9 11s9-5.75 9-11c0-4.97-4.03-9-9-9Zm0 13.5c-2.48 0-4.5-2.02-4.5-4.5s2.02-4.5 4.5-4.5 4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5Z"
                  fill="#273469"
                />
              </svg>
              <div>
                <div className="font-semibold text-[#273469]">No places found</div>
                <div className="text-[#1E2749] text-sm">
                  Try searching for a different location.
                </div>
              </div>
            </div>
          )}
          {results.length > 0 && (
            <div className="flex flex-col gap-4">
              {results.map((place, i) => {
                const placeId = getPlaceId(place);
                // Always use local state for vote count if available
                const voteCount = votes[placeId] ?? place._votes ?? 0;
                const userVote = userVotes[placeId] || null;
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border ${place.userSubmitted ? 'border-yellow-400 bg-yellow-50' : 'border-[#E4D9FF] bg-[#FAFAFF]'} flex flex-row items-start gap-2 relative`}
                  >
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="font-semibold text-[#273469] text-lg flex items-center gap-1">
                        {place.userSubmitted && <span title="User submitted" className="text-yellow-500 text-xl">★</span>}
                        {place.displayName?.text}
                        {place.userSubmitted && <span className="text-yellow-700 text-sm font-normal">(User Submitted)</span>}
                      </span>
                      <div className="text-[#1E2749] text-sm">
                        {place.formattedAddress}
                      </div>
                      {place.rating && (
                        <div className="text-xs text-[#30343F]">
                          Rating: {place.rating} ({place.userRatingCount} reviews)
                        </div>
                      )}
                      {place.websiteUri && (
                        <a
                          href={place.websiteUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#273469] underline"
                        >
                          Website
                        </a>
                      )}
                      <a
                        href={place.googleMapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#273469] underline"
                      >
                        View on Google Maps
                      </a>
                    </div>
                    <div className="flex flex-col items-center ml-auto pr-2">
                      <button
                        aria-label="Upvote"
                        className={`text-[#273469] text-2xl px-2 py-1 ${userVote === "up" ? "text-green-600 font-bold" : "hover:text-green-600"}`}
                        onClick={() => handleVote(place, "up")}
                        type="button"
                      >
                        ▲
                      </button>
                      <span className="font-mono text-base w-8 text-center select-none">
                        {voteCount}
                      </span>
                      <button
                        aria-label="Downvote"
                        className={`text-[#273469] text-2xl px-2 py-1 ${userVote === "down" ? "text-red-600 font-bold" : "hover:text-red-600"}`}
                        onClick={() => handleVote(place, "down")}
                        type="button"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <button
          className="mt-2 mb-6 px-4 py-2 rounded-lg bg-[#E4D9FF] text-[#273469] font-semibold hover:bg-[#C1B2FA] transition-colors"
          onClick={() => setShowSubmit((v) => !v)}
          type="button"
        >
          {showSubmit ? "Hide Submission Form" : "Submit a Unique Place"}
        </button>
        {showSubmit && (
          <form className="w-full max-w-xl flex flex-col gap-3 mb-8 p-6 bg-[#FAFAFF] border border-[#E4D9FF] rounded-2xl shadow" onSubmit={handleSubmitPlace}>
            <h2 className="text-xl font-bold text-[#273469] mb-2">Submit a Unique Place</h2>
            <input
              className="px-4 py-2 rounded border border-[#E4D9FF] bg-white text-base"
              placeholder="Name"
              value={submission.name}
              onChange={e => setSubmission(s => ({ ...s, name: e.target.value }))}
              required
            />
            <input
              className="px-4 py-2 rounded border border-[#E4D9FF] bg-white text-base"
              placeholder="Address"
              value={submission.address}
              onChange={e => setSubmission(s => ({ ...s, address: e.target.value }))}
              required
            />
            <textarea
              className="px-4 py-2 rounded border border-[#E4D9FF] bg-white text-base"
              placeholder="Description"
              value={submission.description}
              onChange={e => setSubmission(s => ({ ...s, description: e.target.value }))}
              required
            />
            <div className="flex gap-2">
              <input
                className="px-4 py-2 rounded border border-[#E4D9FF] bg-white text-base flex-1"
                placeholder="Latitude"
                value={submission.latitude}
                onChange={e => setSubmission(s => ({ ...s, latitude: e.target.value }))}
                required
                type="number"
                step="any"
              />
              <input
                className="px-4 py-2 rounded border border-[#E4D9FF] bg-white text-base flex-1"
                placeholder="Longitude"
                value={submission.longitude}
                onChange={e => setSubmission(s => ({ ...s, longitude: e.target.value }))}
                required
                type="number"
                step="any"
              />
            </div>
            <input
              className="px-4 py-2 rounded border border-[#E4D9FF] bg-white text-base"
              placeholder="Your Email (optional)"
              value={submission.submitterEmail}
              onChange={e => setSubmission(s => ({ ...s, submitterEmail: e.target.value }))}
              type="email"
            />
            <button
              className="mt-2 px-6 py-2 rounded-lg bg-[#273469] text-[#FAFAFF] font-semibold hover:bg-[#30343F] transition-colors"
              type="submit"
              disabled={submitLoading}
            >
              {submitLoading ? "Submitting..." : "Submit"}
            </button>
            {submitSuccess && <div className="text-green-600 text-sm">{submitSuccess}</div>}
            {submitError && <div className="text-red-500 text-sm">{submitError}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
