"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Users, Loader2, User, Sparkles, AlertCircle } from "lucide-react";
import { getCompetition, joinCompetition, Competition, CompetitionParticipant } from "@/lib/api";
import { useCompetitionSocket } from "@/lib/useCompetitionSocket";

export default function JoinCompetitionPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [participant, setParticipant] = useState<CompetitionParticipant | null>(null);
  const [participantCount, setParticipantCount] = useState(0);

  // WebSocket connection (only after joining)
  const { isConnected, on, off } = useCompetitionSocket(
    participant ? competition?.id || null : null,
    participant?.id || null,
    false
  );

  useEffect(() => {
    // Load competition details
    const loadCompetition = async () => {
      try {
        const response = await getCompetition(resolvedParams.code);
        setCompetition(response.competition);
        setParticipantCount(response.participantCount);

        if (response.competition.status !== "waiting") {
          setError("This competition has already started or ended");
        }
      } catch (err: any) {
        setError(err.message || "Competition not found");
      } finally {
        setLoading(false);
      }
    };

    loadCompetition();
  }, [resolvedParams.code]);

  useEffect(() => {
    if (!participant || !competition) return;

    // Listen for competition start
    const handleCompetitionStarted = (data: any) => {
      router.push(`/competition/${competition.id}/play?participantId=${participant.id}`);
    };

    // Listen for participant updates
    const handleParticipantJoined = (data: any) => {
      setParticipantCount((prev) => prev + 1);
    };

    on("competition_started", handleCompetitionStarted);
    on("participant_joined_lobby", handleParticipantJoined);

    return () => {
      off("competition_started", handleCompetitionStarted);
      off("participant_joined_lobby", handleParticipantJoined);
    };
  }, [participant, competition, on, off, router]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!competition) return;

    setJoining(true);
    setError("");

    try {
      const response = await joinCompetition({
        join_code: resolvedParams.code,
        display_name: displayName.trim(),
        avatar: avatar || undefined,
      });

      setParticipant(response.participant);
    } catch (err: any) {
      setError(err.message || "Failed to join competition");
      setJoining(false);
    }
  };

  const avatarOptions = ["😀", "😎", "🤓", "🧑‍🎓", "👨‍💻", "👩‍💻", "🦸", "🧙", "🐱", "🐶", "🦊", "🐼"];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading competition...</p>
        </div>
      </div>
    );
  }

  if (error && !competition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Competition Not Found</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/competition")}
            className="px-6 py-3 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          >
            Back to Competitions
          </button>
        </div>
      </div>
    );
  }

  if (!competition) return null;

  // Waiting screen (after joining)
  if (participant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Competition Info Card */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 mb-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-white" />
              </div>

              <h1 className="text-3xl font-bold text-white mb-2">{competition.quizTopic}</h1>
              <p className="text-gray-400 mb-6">Hosted by {competition.hostName}</p>

              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span className="text-white font-semibold">{participantCount} / {competition.maxParticipants}</span>
                  <span className="text-gray-400">participants</span>
                </div>
              </div>

              {/* Pulsing Waiting Animation */}
              <div className="relative py-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-purple-500/20 animate-ping" />
                </div>
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Waiting for Host</h2>
              <p className="text-gray-400">
                The competition will start soon. Get ready to compete!
              </p>

              {/* Connection Status */}
              <div className="mt-6 flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-sm text-gray-400">
                  {isConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>

          {/* Your Info Card */}
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-xl p-6 text-center">
            <p className="text-gray-400 mb-2">You're in as</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">{participant.avatar || "👤"}</span>
              <span className="text-xl font-semibold text-white">{participant.displayName}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Join form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Competition Info */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
            <Trophy className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-purple-300 font-mono">{competition.joinCode}</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-2">{competition.quizTopic}</h1>
          <p className="text-gray-400">Hosted by {competition.hostName}</p>

          <div className="flex items-center justify-center gap-2 mt-4">
            <Users className="w-5 h-5 text-cyan-400" />
            <span className="text-white">{participantCount} / {competition.maxParticipants} participants</span>
          </div>
        </div>

        {/* Join Form */}
        <form onSubmit={handleJoin} className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setError("");
                }}
                placeholder="Enter your name"
                maxLength={30}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Choose Avatar (Optional)
            </label>
            <div className="grid grid-cols-6 gap-2">
              {avatarOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`p-3 rounded-xl text-2xl hover:bg-slate-700/50 transition-colors ${
                    avatar === emoji ? 'bg-purple-500/20 ring-2 ring-purple-500' : 'bg-slate-900/30'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={joining || !displayName.trim()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {joining ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Join Competition
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
