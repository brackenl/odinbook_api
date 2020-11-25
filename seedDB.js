require("dotenv").config();
var faker = require("faker");

var Post = require("./models/post");
var User = require("./models/user");
var Comment = require("./models/comment");

const users = [];
const posts = [];
const comments = [];

require("./utils/mongoConfig");

const shuffleArray = (relArr) => {
  const array = [...relArr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const generateUser = () => {
  const user = new User({
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    profilePicUrl: faker.image.imageUrl(),
    posts: [],
    friends: [],
    friendRequests: [],
  });
  users.push(user);
};

const generateFriends = () => {
  users.forEach((user) => {
    const shuffledUsers = shuffleArray(users);
    // console.log("shuffled users: ", shuffledUsers);
    const randIndex = Math.floor(Math.random() * shuffledUsers.length);
    // console.log("randIndex: ", randIndex);
    const randSlicedUsers = shuffledUsers.slice(0, randIndex);
    // console.log("randSlicedUsers: ", randSlicedUsers);
    user.friends = randSlicedUsers.map((user) => user._id);
  });
};

const generatePost = (user) => {
  // const randUserInd = Math.floor(Math.random() * users.length);
  // const randUser = users[randUserInd];

  const post = new Post({
    author: user,
    content: faker.lorem.sentences(),
    timestamp: faker.date.past(2),
    comment: [],
    likes: [],
  });
  posts.push(post);
  user.posts.push(post._id);
};

const addPosts = () => {
  users.forEach((user) => {
    for (let i = 0; i < Math.floor(Math.random() * 6); i++) {
      generatePost(user);
    }
  });
};

const addLikesToPosts = () => {
  posts.forEach((post) => {
    post.author.friends.forEach((friend) => {
      if (Math.random() > 0.6) {
        post.likes.push(friend._id);
      }
    });
  });
};

const addCommentsToPosts = () => {
  posts.forEach((post) => {
    post.author.friends.forEach((friend) => {
      if (Math.random() > 0.9) {
        const comment = new Comment({
          user: friend._id,
          comment: faker.lorem.sentence(),
          timestamp: new Date(),
          post: post._id,
          likes: [],
        });
        comments.push(comment);
        post.comments.push(comment._id);
      }
    });
  });
};

const addLikesToComments = () => {
  posts.forEach((post) => {
    post.comments.forEach((comment) => {
      const relComment = comments.find((comm) => comm._id === comment);
      post.author.friends.forEach((user) => {
        if (Math.random() > 0.3) {
          relComment.likes.push(user._id);
        }
      });
    });
  });
};

const seedDB = () => {
  for (let i = 0; i < 50; i++) {
    generateUser();
  }

  generateFriends();
  addPosts();
  addLikesToPosts();
  addCommentsToPosts();
  addLikesToComments();

  users.forEach(async (user) => {
    try {
      await user.save();
    } catch (e) {
      console.log(e);
    }
  });

  posts.forEach(async (post) => {
    try {
      await post.save();
    } catch (e) {
      console.log(e);
    }
  });

  comments.forEach(async (comment) => {
    try {
      await comment.save();
    } catch (e) {
      console.log(e);
    }
  });

  return { users, posts, comments };
};

seedDB();

/*
// GENERATE

for (let i = 0; i < 50; i++) {
  generateUser();
}

generateFriends();
addPosts();
addLikesToPosts();
addCommentsToPosts();
addLikesToComments();

console.log("users: ", users);
console.log("posts: ", posts);
console.log("comments: ", comments);
*/

module.exports = seedDB;
