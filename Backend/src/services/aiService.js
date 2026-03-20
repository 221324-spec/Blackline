const OpenAI = require('openai');


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

const OPENAI_ENABLED = !!process.env.OPENAI_API_KEY;

/**
 * Analyze trading performance using OpenAI GPT-4
 * @param {Object} tradeData - User's trade data and metrics
 * @returns {Promise<Object>} AI analysis results
 */
async function analyzeTrades(tradeData) {
  try {
    const { trades, metrics, userName } = tradeData;


    if (!OPENAI_ENABLED) {
      console.log('⚠️ No OpenAI API key, using mock analysis');
      return getMockAnalysis(metrics, userName);
    }


    const tradeSummary = trades.slice(0, 10).map(t => ({
      outcome: t.outcome,
      profitLoss: t.profitLoss,
      riskReward: t.riskReward,
      symbol: t.symbol || 'N/A',
      setup: t.setup || 'Not specified'
    }));

    const prompt = `You are an expert trading analyst. Analyze this trader's performance:

Trader: ${userName}
Total Trades: ${metrics.total}
Win Rate: ${metrics.winRate}%
Average Risk:Reward: ${metrics.avgRR}
Grade: ${metrics.grade}

Recent Trades Summary:
${tradeSummary.map(t => `- ${t.symbol}: ${t.outcome} (P/L: ${t.profitLoss}, R:R: ${t.riskReward})`).join('\n')}

Provide analysis in JSON format:
{
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "riskLevel": "Low/Medium/High",
  "riskExplanation": "brief explanation",
  "nextSteps": ["step1", "step2"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert trading analyst. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    
    return {
      success: true,
      analysis,
      timestamp: new Date(),
      usingMockData: false
    };

  } catch (error) {
    console.error('❌ AI Analysis Error:', error.message);
    return getMockAnalysis(tradeData.metrics, tradeData.userName);
  }
}

/**

 */
function getMockAnalysis(metrics, userName) {
  const winRate = metrics.winRate || 0;
  const avgRR = metrics.avgRR || 0;
  const grade = metrics.grade || 'E';

  
  let riskLevel = 'Medium';
  let riskExplanation = 'Your trading shows moderate risk patterns.';
  
  if (winRate < 40) {
    riskLevel = 'High';
    riskExplanation = 'Low win rate indicates high risk. Focus on strategy refinement.';
  } else if (winRate > 60 && avgRR > 2) {
    riskLevel = 'Low';
    riskExplanation = 'Strong metrics suggest well-managed risk levels.';
  }

  
  const strengths = [];
  if (winRate >= 50) strengths.push('Maintaining a solid win rate above 50%');
  if (avgRR >= 1.5) strengths.push('Good risk-reward ratio management');
  if (grade <= 'B') strengths.push('Consistent trading performance');
  if (strengths.length === 0) strengths.push('Active engagement in tracking trades');


  const weaknesses = [];
  if (winRate < 50) weaknesses.push('Win rate below optimal 50% threshold');
  if (avgRR < 1.5) weaknesses.push('Risk-reward ratio needs improvement');
  if (metrics.total < 20) weaknesses.push('Limited trade history for comprehensive analysis');
  if (weaknesses.length === 0) weaknesses.push('Room for optimization in trade execution timing');

  
  const recommendations = [
    'Review losing trades to identify common patterns and avoid repeating mistakes',
    'Set clear profit targets and stop losses before entering positions',
    'Maintain a trading journal to track emotional state and decision-making process',
    'Consider reducing position size during periods of consecutive losses'
  ];


  const nextSteps = [
    'Analyze your last 5 losing trades and document the reasons',
    'Set a minimum 1:2 risk-reward ratio for all new trades',
    'Practice with a demo account before trying new strategies'
  ];

  return {
    success: true,
    analysis: {
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      recommendations: recommendations.slice(0, 4),
      riskLevel,
      riskExplanation,
      nextSteps: nextSteps.slice(0, 3)
    },
    timestamp: new Date(),
    usingMockData: true
  };
}


async function getQuickTip(metrics) {
  const tips = [
    {
      condition: (m) => m.winRate < 40,
      tip: 'Your win rate is below 40%. Consider reducing your trading frequency and focusing on high-probability setups only.',
      icon: '⚠️'
    },
    {
      condition: (m) => m.avgRR < 1,
      tip: 'Your risk-reward ratio is below 1:1. Always aim for at least 1:2 to ensure long-term profitability.',
      icon: '📊'
    },
    {
      condition: (m) => m.winRate >= 60 && m.avgRR >= 2,
      tip: 'Excellent performance! Maintain your current strategy and consider gradually increasing position sizes.',
      icon: '🎯'
    },
    {
      condition: (m) => m.total < 10,
      tip: 'Build more trading history for better analysis. Aim for at least 20-30 trades to identify patterns.',
      icon: '📈'
    }
  ];


  for (const tipObj of tips) {
    if (tipObj.condition(metrics)) {
      return {
        tip: tipObj.tip,
        icon: tipObj.icon,
        timestamp: new Date()
      };
    }
  }


  return {
    tip: 'Stay disciplined! Consistency in following your trading plan is key to long-term success.',
    icon: '💡',
    timestamp: new Date()
  };
}


async function analyzeSingleTrade(trade) {
  try {
    if (!OPENAI_ENABLED) {
      return {
        analysis: `This ${trade.outcome} trade shows ${trade.outcome === 'Win' ? 'good execution' : 'areas for improvement'}. Focus on maintaining your risk management and staying disciplined with your trading plan.`,
        timestamp: new Date()
      };
    }

    // Include AI prediction if available to allow the model to comment on prediction vs outcome
    const predInfo = trade.prediction ? `Prediction: ${trade.prediction.recommendation} (winProb: ${trade.prediction.winProbability || 'N/A'}, conf: ${trade.prediction.confidence || 'N/A'})` : 'Prediction: none';

    const prompt = `Analyze this trade:
  Symbol: ${trade.symbol || 'N/A'}
  Entry: ${trade.entryPrice}
  Exit: ${trade.exitPrice}
  Result: ${trade.outcome}
  P/L: ${trade.profitLoss}
  R:R: ${trade.riskReward}
  ${predInfo}
  Notes: ${trade.notes && trade.notes.length ? trade.notes.map(n=>n.text).join('; ') : 'No notes'}

  Provide brief 2-3 sentence analysis covering what went well/wrong, whether the AI prediction matched the outcome, and one improvement suggestion.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a trading coach. Be concise and actionable.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    return {
      analysis: response.choices[0].message.content.trim(),
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Single trade analysis error:', error);
    return {
      analysis: 'Unable to generate AI analysis at this time. Please try again later.',
      timestamp: new Date()
    };
  }
}


async function analyzePattern(trades) {
  try {
    if (!OPENAI_ENABLED || trades.length < 5) {
      return {
        insights: 'Add more trades (at least 5) to unlock AI pattern analysis.',
        stats: { totalTrades: trades.length },
        timestamp: new Date()
      };
    }

    const wins = trades.filter(t => t.outcome === 'Win').length;
    const total = trades.length;
    const winRate = ((wins / total) * 100).toFixed(1);
    
    const symbols = {};
    trades.forEach(t => {
      const sym = t.symbol || 'Unknown';
      symbols[sym] = (symbols[sym] || 0) + 1;
    });
    
    const topSymbols = Object.entries(symbols)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s, c]) => `${s} (${c})`);

    const prompt = `Analyze these trading patterns:

Stats: ${total} trades, ${winRate}% win rate
Top symbols: ${topSymbols.join(', ')}
Recent: ${trades.slice(0, 5).map(t => `${t.outcome} on ${t.symbol}`).join(', ')}

Provide:
**Patterns Identified**
- pattern1
- pattern2

**Recommendations**
- rec1
- rec2
- rec3`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a pattern recognition expert for trading.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.7
    });

    return {
      insights: response.choices[0].message.content.trim(),
      stats: { totalTrades: total, winRate: parseFloat(winRate), wins, losses: total - wins },
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Pattern analysis error:', error);
    return {
      insights: 'Pattern analysis temporarily unavailable.',
      stats: { totalTrades: trades.length },
      timestamp: new Date()
    };
  }
}


async function getTradingAdvice(metrics, trades) {
  try {
    if (!OPENAI_ENABLED) {
      return {
        advice: `Focus on maintaining consistency. Your current win rate is ${metrics.winRate}%. Continue following your trading plan and managing risk properly.`,
        timestamp: new Date()
      };
    }

    const recentTrades = trades.slice(0, 5).map(t => 
      `${t.outcome} on ${t.symbol || 'N/A'}: ${t.profitLoss > 0 ? '+' : ''}${t.profitLoss}`
    ).join(', ');

    const prompt = `Based on these trading metrics, provide personalized advice:

Overall Stats:
- Total Trades: ${metrics.totalTrades}
- Win Rate: ${metrics.winRate}%
- Avg Risk:Reward: ${metrics.avgRiskReward}
- Best Trade: $${metrics.bestTrade}
- Worst Trade: $${metrics.worstTrade}

Recent Trades: ${recentTrades}

Provide 2-3 sentences of actionable advice focusing on improvement areas.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a trading coach providing personalized daily advice.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 250,
      temperature: 0.7
    });

    return {
      advice: response.choices[0].message.content.trim(),
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Trading advice error:', error);
    return {
      advice: 'Focus on consistency, proper risk management, and following your trading plan.',
      timestamp: new Date()
    };
  }
}

async function identifyMistakes(trade) {
  try {
    if (!OPENAI_ENABLED) {
      const mistakes = [];
      if (trade.outcome === 'Loss') {
        mistakes.push('Review entry criteria - ensure setup matched your strategy');
        if (!trade.riskReward || trade.riskReward < 1.5) {
          mistakes.push('Risk:Reward ratio below recommended 1.5:1');
        }
      }
      return {
        mistakes: mistakes.length > 0 ? mistakes : ['No obvious mistakes detected. Continue following your plan.'],
        timestamp: new Date()
      };
    }

    const prompt = `Analyze this trade for potential mistakes:

Symbol: ${trade.symbol || 'N/A'}
Entry: ${trade.entryPrice}
Exit: ${trade.exitPrice}
Result: ${trade.outcome}
P/L: ${trade.profitLoss}
R:R: ${trade.riskReward || 'N/A'}
Stop Loss: ${trade.stopLoss || 'N/A'}
Take Profit: ${trade.takeProfit || 'N/A'}
Notes: ${trade.notes || 'No notes'}

List 2-3 specific mistakes or areas for improvement. Be direct and actionable.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You identify trading mistakes and provide constructive feedback.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    const content = response.choices[0].message.content.trim();
   
    const mistakes = content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[-•*]\s*/, '').trim());

    return {
      mistakes: mistakes.length > 0 ? mistakes : ['No significant mistakes identified.'],
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Mistake identification error:', error);
    return {
      mistakes: ['Unable to analyze mistakes at this time.'],
      timestamp: new Date()
    };
  }
}

module.exports = {
  analyzeTrades,
  getQuickTip,
  analyzeSingleTrade,
  analyzePattern,
  getTradingAdvice,
  identifyMistakes
};
